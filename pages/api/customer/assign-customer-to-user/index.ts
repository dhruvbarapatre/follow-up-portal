import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { customerId, UsersIds, userType } = req.body;

  if (!customerId && !UsersIds) {
    return res.status(400).json({ message: "followUpId is required" });
  }
  
  await dbConnect();

  try {

    const customers = await CustomerModel.updateOne(
      { _id: customerId },
      {
        $push: {
          whoCanFollowUp: { $each: UsersIds }, // allows duplicates
        },
      }
    );
    return res.status(200).json({
      data: customers,
      message: "customer assign to users successfully",
    });
  } catch (error) {
    console.error("Error finding customers:", error);
    return res.status(500).json({ message: "Server Error" });
  }
}
