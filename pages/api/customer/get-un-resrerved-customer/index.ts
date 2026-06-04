import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const data = await CustomerModel.find({
      whoCanFollowUp: { $size: 0 }
    });

    return res.status(200).json({ data });
  } catch (error: any) {
    return res.status(400).json({ message: "Error fetching unreserved customers", error: error.message });
  }
}
