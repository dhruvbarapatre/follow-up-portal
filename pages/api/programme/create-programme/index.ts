import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/attendence.model";

export async function POST(req: NextRequest) {
    return NextResponse.json(
        {
            message: "ok",
        },
        { status: 201 }
    );
    // try {
    //     await dbConnect();

    //     const body = await req.json();
    //     const { title, date, time, description, users } = body;

    //     // Validation
    //     if (!title || !date || !time || !users || users.length === 0) {
    //         return NextResponse.json(
    //             { message: "Missing required fields" },
    //             { status: 400 }
    //         );
    //     }

    //     // Check if programme already exists for the date
    //     const existingProgramme = await Attendance.findOne({ date });

    //     if (existingProgramme) {
    //         return NextResponse.json(
    //             { message: "Programme already exists for this date" },
    //             { status: 409 }
    //         );
    //     }

    //     const programme = await Attendance.create({
    //         title,
    //         date,
    //         time,
    //         description,
    //         users,
    //     });

    //     return NextResponse.json(
    //         {
    //             message: "Programme created successfully",
    //             data: programme,
    //         },
    //         { status: 201 }
    //     );
    // } catch (error) {
    //     console.error("Programme creation error:", error);

    //     return NextResponse.json(
    //         { message: "Internal Server Error" },
    //         { status: 500 }
    //     );
    // }
}
