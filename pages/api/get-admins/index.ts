import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import AdminModel from "@/models/admin.model";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Allow only GET method
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // connect to MongoDB
        await dbConnect();

        // fetch all admins
        const data = await AdminModel.find({});

        return res.status(200).json({ data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
}
