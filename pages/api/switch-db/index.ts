// pages/api/switch-db.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect, { dbDisconnect } from "@/lib/dbConnect";
import dbConnectCongrigation, { dbDisconnectCongrigation } from "@/lib/dbConnect-congrigation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userType } = req.body;
    let msg = ""
    if (userType === "youth") {
        dbDisconnectCongrigation()
        dbConnect()
        msg = "switch to youth"

    } else if (userType === "congregation") {
        dbDisconnect()
        dbConnectCongrigation()
        msg = "switch to congregation"
    }
    res.status(200).json({ success: msg });
}
