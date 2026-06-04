import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/attendence.model";
import CustomerModel from "@/models/customer.model"; // Ensure model registration

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  try {
    const list = await Attendance.find({})
      .populate("invitedCustomers.customerId")
      .sort({ date: 1, time: 1 });

    return res.status(200).json({ data: list });
  } catch (error: any) {
    return res.status(400).json({ message: "Error fetching programs", error: error.message });
  }
}
