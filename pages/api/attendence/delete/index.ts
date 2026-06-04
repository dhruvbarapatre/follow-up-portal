import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/attendence.model";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Program ID is required" });
    }

    await Attendance.findByIdAndDelete(id);

    return res.status(200).json({ message: "Program deleted successfully" });
  } catch (error: any) {
    return res.status(400).json({ message: "Error deleting program", error: error.message });
  }
}
