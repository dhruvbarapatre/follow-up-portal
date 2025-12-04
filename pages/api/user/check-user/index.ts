// pages/api/checkUser.ts

import type { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload } from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow POST only
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { fyp_token } = req.body; // <-- token from body (same as Express)

  if (!fyp_token) {
    return res.status(400).json({ message: "Token Not Found..." });
  }

  const secret = process.env.SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ message: "Server Secret Key Missing" });
  }

  jwt.verify(fyp_token, secret, (err:any, decoded:any) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!decoded) {
      return res.status(400).json({ message: "Your Token Is Invalid" });
    }

    const payload = decoded as JwtPayload;

    // Remove password if it exists
    const { password, ...rest } = payload;

    return res.status(200).json({
      data: { ...rest, token: fyp_token },
      message: "Welcome Follow Up Portal",
    });
  });
}
