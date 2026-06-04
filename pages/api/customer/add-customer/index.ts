import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    const { name, phoneNumber, adderId, isMarried, ...rest } = req.body;
    if (!name || !phoneNumber || !adderId) {
        return res.status(400).json({
            message: "name and phoneNumber must be provided",
        });
    }
    await dbConnect();
    try {
        await CustomerModel.create({
            ...rest,
            name, phoneNumber, adderId,
            isMarried: isMarried === true || isMarried === "true" || false,
        });
        return res
            .status(200)
            .json({ message: "User Added Successfully" });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Server Error",
        });
    }
}
