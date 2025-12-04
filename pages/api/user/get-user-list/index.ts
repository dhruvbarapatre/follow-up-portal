import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";
import dbConnectCongrigation from "@/lib/dbConnect-congrigation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {

    const { followUpId, userType } = req.body;

    if (!followUpId || !userType) {
      return res.status(400).json({ message: "followUpId is required" });
    }

    if (userType === "youth") {
      await dbConnect();
    } else if (userType === "congregation") {
      await dbConnectCongrigation();
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Same logic you wrote
    const customers = await CustomerModel.find({
      whoCanFollowUp: { $in: followUpId }
    });

    if (customers && customers.length) {
      return res.status(200).json({
        data: customers,
        message: "User Gets suces"
      });
    }

    return res.status(200).json({
      message: "user has no list"
    });

  } catch (error: any) {
    console.error("Error finding customers:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
}
