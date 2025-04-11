import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db"; // Your MySQL connection pool
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ boardId: string }> }
) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Await the Promise-wrapped params to extract boardId
    const resolvedParams = await context.params;
    const boardId = parseInt(resolvedParams.boardId, 10);
    if (isNaN(boardId)) {
      return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
    }

    // Verify the user has access to this board
    const [accessCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT 1 FROM board_users WHERE user_id = ? AND board_id = ?",
      [decoded.userId, boardId]
    );
    if (!accessCheck || accessCheck.length === 0) {
      return NextResponse.json({ error: "Unauthorized access to this board" }, { status: 403 });
    }

    // Fetch lists for the board
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name FROM lists WHERE board_id = ?",
      [boardId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ lists: [] }, { status: 200 }); // Empty array if no lists
    }

    return NextResponse.json({ lists: rows }, { status: 200 });
  } catch (err) {
    console.error("Lists route error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
