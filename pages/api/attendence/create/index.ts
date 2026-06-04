import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/attendence.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const { title, date, time, description, invitedCustomerIds } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({ message: "Title, date, and time are required" });
    }

    // Convert date string to Date object
    const dateObj = new Date(date);

    const invitedCustomers = (invitedCustomerIds || []).map((id: string) => ({
      customerId: id,
      status: "invited",
      response: "pending",
      callingBy: "",
    }));

    const program = await Attendance.create({
      title,
      date: dateObj,
      time,
      description,
      invitedCustomers,
      users: [],
    });

    return res.status(201).json({ message: "Program created successfully", data: program });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A program is already scheduled on this date." });
    }
    return res.status(400).json({ message: "Error creating program", error: error.message });
  }
}
