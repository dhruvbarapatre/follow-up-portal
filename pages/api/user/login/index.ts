import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/dbConnect";
import dbConnectCongrigation from "@/lib/dbConnect-congrigation";
import UserModel from "@/models/user.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { phoneNumber, password, userType } = req.body;

    if (!phoneNumber || !password || !userType) {
        return res.status(400).json({ message: "Fill all fields including user type" });
    }

    try {
        // select correct database
        if (userType === "youth") {
            await dbConnect();
        } else if (userType === "congregation") {
            await dbConnectCongrigation();
        } else {
            return res.status(400).json({ message: "Invalid user type" });
        }

        // find user
        const user = await UserModel.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // compare bcrypt password
        const isMatch = password ==  user.password;

        if (!isMatch) {
            return res.status(401).json({ message: "Wrong password" });
        }

        // token payload
        const payload = {
            id: user._id,
            phoneNumber: user.phoneNumber,
            name: user.name,
            role: user.role,
            userType,
        };

        const token = jwt.sign(payload, process.env.SECRET_KEY!, { expiresIn: "7d" });

        return res.status(200).json({
            message: "Login successful",
            token
        });

    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}
