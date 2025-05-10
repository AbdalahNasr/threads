import { NextRequest, NextResponse } from "next/server";
import { getMongoDBStatus } from "@/lib/mongodb-tester";

/**
 * API Route to test MongoDB connection
 */
export async function GET(req: NextRequest) {
  try {
    const result = await getMongoDBStatus();
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: `API error: ${error.message}` 
      },
      { status: 500 }
    );
  }
}