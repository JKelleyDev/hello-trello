import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const boardId = parseInt(params.boardId, 10);
    if (isNaN(boardId)) {
      return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
    }

    const [accessCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT 1 FROM board_users WHERE user_id = ? AND board_id = ?",
      [decoded.userId, boardId]
    );
    if (!accessCheck || accessCheck.length === 0) {
      return NextResponse.json({ error: "Unauthorized access to this board" }, { status: 403 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, board_id, list_id, title FROM cards WHERE board_id = ?",
      [boardId]
    );

    return NextResponse.json({ cards: rows }, { status: 200 });
  } catch (err) {
    console.error("Cards route error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}