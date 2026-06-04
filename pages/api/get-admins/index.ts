import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import userModel from "@/models/user.model";

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

        // fetch only users with role "superAdmin"
        const data = await userModel.find({ role: "superAdmin" }).select("name phoneNumber");

        return res.status(200).json({ data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
}
