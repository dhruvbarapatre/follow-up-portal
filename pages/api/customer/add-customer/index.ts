import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";
import dbConnectCongrigation from "@/lib/dbConnect-congrigation";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    const { name, phoneNumber, adderId } = req.body;
    const { userType, ...rest } = req.body;
    if (!name || !phoneNumber || !adderId || !userType) {
        return res.status(400).json({
            message: "name and phoneNumber must be provided",
        });
    }
    if (userType === "youth") {
        await dbConnect();
    } else if (userType === "householder") {
        await dbConnectCongrigation();
    }
    try {
        await CustomerModel.create(rest);
        return res
            .status(200)
            .json({ message: "User Added Successfully" });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Server Error",
        });
    }
}
