import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import userModel from "@/models/user.model";
import dbConnectCongrigation from "@/lib/dbConnect-congrigation";

interface AuthRequest extends NextApiRequest {
    userData?: any;
}

export default async function handler(req: AuthRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    
    const { token, userType } = req.body;
    if (!token || !userType) {
        return res.status(400).json({ message: "Token is required" });
    }

    if (userType === "youth") {
        await dbConnect();
    } else if (userType === "congregation") {
        await dbConnectCongrigation();
    } else {
        return res.status(400).json({ message: "Invalid user type" });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY!);
        if (typeof decoded === "object") {
            req.userData = (decoded as any)._doc ? (decoded as any)._doc : decoded;
        }
    } catch (err: any) {
        return res.status(400).json({
            message: "Invalid Token",
            error: err.message,
        });
    }
    if (req.userData.role !== "superAdmin") {
        return res.status(403).json({ message: "Access denied. Not an admin." });
    }
    try {
        const users = await userModel.find({});
        if (!users.length) {
            return res.status(404).json({ message: "No users found." });
        }
        return res.status(200).json({
            data: users,
            message: "All users fetched successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Server Error",
            error: error.message,
        });
    }
}
