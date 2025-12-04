import mongoose, { Schema, Document, Model } from "mongoose";

// 1️⃣ MAIN INTERFACE (full type for a customer)
export interface ICustomer extends Document {
    name: string;
    phoneNumber: number;
    adderId: string;
    chanting?: number;
    address?: string;
    age?: number;

    outOfStation?: {
        isOutOfStation: boolean;
        isOutOfStationPlace?: string;
        tillDateOutOfStation?: string;
        lastTimeAttend?: boolean;
        lastTimeNotAttendReason?: string;
    };

    lastTimeAgreedButNotCome?: {
        anyEmergency?: boolean;
        lastTimeReason?: string;
        forgetToCome?: boolean;
        isDoingFalsePromise?: boolean;
    };

    goodConnectionWith?: {
        name?: string;
        relation?: string;
        phoneNumber?: number;
    }[];

    whoCanFollowUp?: string[];
}

// 2️⃣ SCHEMA
const CustomerSchema: Schema<ICustomer> = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: Number,
            required: true,
        },
        adderId: {
            type: String,
            required: true,
        },
        chanting: {
            type: Number,
        },
        address: {
            type: String,
        },
        age: {
            type: Number,
        },

        outOfStation: {
            isOutOfStation: {
                type: Boolean,
                default: false,
            },
            isOutOfStationPlace: {
                type: String,
                default: "",
            },
            tillDateOutOfStation: {
                type: String,
            },
            lastTimeAttend: {
                type: Boolean,
            },
            lastTimeNotAttendReason: {
                type: String,
            },
        },

        lastTimeAgreedButNotCome: {
            anyEmergency: {
                type: Boolean,
            },
            lastTimeReason: {
                type: String,
            },
            forgetToCome: {
                type: Boolean,
            },
            isDoingFalsePromise: {
                type: Boolean,
            },
        },

        goodConnectionWith: [
            {
                name: String,
                relation: String,
                phoneNumber: Number,
            },
        ],

        whoCanFollowUp: {
            type: [String],
            default: [],
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

// 3️⃣ FIX Next.js hot reload: prevent model overwrite errors
const CustomerModel: Model<ICustomer> =
    mongoose.models.Customer ||
    mongoose.model<ICustomer>("Customer", CustomerSchema);

export default CustomerModel;