import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    await dbConnect();

    try {
        const customers = await CustomerModel.find({});
        return res.status(200).json({
            data: customers,
            message: "Customers fetched successfully",
        });
    } catch (error) {
        console.error("Error finding customers:", error);
        return res.status(500).json({ message: "Server Error" });
    }
}

