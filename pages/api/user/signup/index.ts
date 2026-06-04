import type { NextApiRequest, NextApiResponse } from "next";
import UserModel from "@/models/user.model";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { name, phoneNumber, password } = req.body;

    if (!name || !phoneNumber || !password) {
        return res.status(409).json({ message: "Fill all fields" });
    }
    
    await dbConnect();

    try {
        const existingUser = await UserModel.findOne({ phoneNumber });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const newUser = await UserModel.create({
            name,
            phoneNumber,
            password,
            role: "user",
        });

        return res.status(200).json({
            message: "User Registered Successfully",
            user: newUser,
        });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}
