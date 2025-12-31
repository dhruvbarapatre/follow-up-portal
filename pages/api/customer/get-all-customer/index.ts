import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";
import dbConnectCongrigation from "@/lib/dbConnect-congrigation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    const { userType } = req.body;

    if (!userType) {
        return res.status(400).json({ message: "userType is required" });
    }
    if (userType === "youth") {
        await dbConnect();
    } else if (userType === "congregation") {
        await dbConnectCongrigation();
    } else {
        return res.status(400).json({ message: "Invalid user type" });
    }

    try {

        const customers = await CustomerModel.find({});
        return res.status(200).json({
            data: customers,
            message: "customer assign to users successfully",
        });
    } catch (error) {
        console.error("Error finding customers:", error);
        return res.status(500).json({ message: "Server Error" });
    }
}
