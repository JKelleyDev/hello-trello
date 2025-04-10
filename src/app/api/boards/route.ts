import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db"; // Your MySQL connection pool
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Query board_users joined with boards for the user's boards
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         bu.id AS board_user_id, 
         bu.board_id, 
         bu.role, 
         b.name AS board_name 
       FROM board_users bu
       INNER JOIN boards b ON bu.board_id = b.id
       WHERE bu.user_id = ?`,
      [decoded.userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ boards: [] }, { status: 200 }); // Empty array if no boards
    }

    // Format the response
    const boards = rows.map((row) => ({
      boardUserId: row.board_user_id,
      boardId: row.board_id,
      name: row.board_name,
      role: row.role,
    }));

    return NextResponse.json({ boards }, { status: 200 });
  } catch (err) {
    console.error("Boards route error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}