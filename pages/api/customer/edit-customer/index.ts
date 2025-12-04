import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    await dbConnect();

    const { _id, updateData } = req.body;

    if (!_id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const updatedUser = await CustomerModel.findByIdAndUpdate(
            _id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "User updated successfully",
            data: updatedUser,
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error updating user",
            error: error.message,
        });
    }
}
