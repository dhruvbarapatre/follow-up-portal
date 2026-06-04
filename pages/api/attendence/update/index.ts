import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/attendence.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const { id, title, date, time, description, invitedCustomerIds, invitedCustomers } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Program ID is required" });
    }

    const updateObj: any = {};
    if (title !== undefined) updateObj.title = title;
    if (date !== undefined) updateObj.date = new Date(date);
    if (time !== undefined) updateObj.time = time;
    if (description !== undefined) updateObj.description = description;

    if (invitedCustomers !== undefined) {
      updateObj.invitedCustomers = invitedCustomers;
    } else if (invitedCustomerIds !== undefined) {
      const existing = await Attendance.findById(id);
      const existingInvites = existing?.invitedCustomers || [];
      
      updateObj.invitedCustomers = invitedCustomerIds.map((cid: string) => {
        const found = existingInvites.find((x: any) => x.customerId?.toString() === cid);
        if (found) return found;
        return {
          customerId: cid,
          status: "invited",
          response: "pending",
          callingBy: "",
        };
      });
    }

    const updated = await Attendance.findByIdAndUpdate(id, updateObj, { new: true })
      .populate("invitedCustomers.customerId");

    return res.status(200).json({ message: "Program updated successfully", data: updated });
  } catch (error: any) {
    return res.status(400).json({ message: "Error updating program", error: error.message });
  }
}
