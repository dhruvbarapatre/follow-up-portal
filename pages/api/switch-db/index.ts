// pages/api/switch-db.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userType } = req.body;
    res.status(200).json({ success: `switch to ${userType}` });
}
