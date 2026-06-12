import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import CustomerModel from "@/models/customer.model";
import userModel from "@/models/user.model";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { name, phoneNumber } = req.body;
    if (!name && !phoneNumber) {
        return res.status(400).json({
            message: "name or phoneNumber must be provided",
        });
    }

    await dbConnect();

    try {
        const query: any[] = [];
        if (name && name.trim()) {
            // Case-insensitive exact match
            const escapedName = name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            query.push({ name: { $regex: new RegExp("^" + escapedName + "$", "i") } });
        }
        if (phoneNumber) {
            const phoneNum = Number(phoneNumber);
            if (!isNaN(phoneNum)) {
                query.push({ phoneNumber: phoneNum });
            }
        }

        if (query.length === 0) {
            return res.status(200).json({ exists: false, customer: null });
        }

        // Find matching customer
        const duplicate = await CustomerModel.findOne({ $or: query });

        if (duplicate) {
            let adderName = "";
            if (duplicate.adderId) {
                try {
                    const adder = await userModel.findById(duplicate.adderId);
                    if (adder) {
                        adderName = adder.name;
                    }
                } catch (e) {
                    // Ignore lookup errors
                }
            }

            return res.status(200).json({ 
                exists: true, 
                customer: duplicate,
                adderName
            });
        }

        return res.status(200).json({ exists: false, customer: null });
    } catch (error: any) {
        console.error("Error in check-duplicate customer API:", error);
        return res.status(500).json({
            message: error.message || "Server Error",
        });
    }
}
