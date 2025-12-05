import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";
import dbConnectCongrigation from "@/lib/dbConnect-congrigation";

interface AuthRequest extends NextApiRequest {
    userData?: any; // This comes from your auth middleware
}

export default async function handler(req: AuthRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        await dbConnect();
        // await dbConnectCongrigation();

        // ⛔ req.userData will NOT exist unless your auth middleware attaches it
        if (!req.userData) {
            return res.status(401).json({ message: "Unauthorized. No user data found." });
        }

        const users = await CustomerModel.find({});

        if (!users.length) {
            return res.status(404).json({ message: "No users found." });
        }

        // Filter out current admin by phone number (same as your original logic)
        const filteredUsers = users.filter(
            (el) => el.phoneNumber !== req.userData.phoneNumber
        );

        return res.status(200).json({
            data: filteredUsers, // Your original code returned all users, but logic says filtered
            message: "All users fetched successfully",
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
        });
    }
}
