import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        // Simple test query
        const collections = await db.listCollections().toArray();

        return NextResponse.json({ message: "Connected successfully!", collections });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to connect to DB" }, { status: 500 });
    }
}