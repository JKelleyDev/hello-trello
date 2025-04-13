import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "No token provided" }, { status: 401 });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  
      const { title, description, boardId, listId } = await request.json();
  
      if (!title || !boardId || !listId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
  
      // Check if user is an owner or editor on the board
      const [accessCheck] = await pool.execute<RowDataPacket[]>(
        "SELECT role FROM board_users WHERE user_id = ? AND board_id = ?",
        [decoded.userId, boardId]
      );
  
      if (!accessCheck || accessCheck.length === 0) {
        return NextResponse.json({ error: "Unauthorized access to this board" }, { status: 403 });
      }
  
      const userRole = accessCheck[0].role.toLowerCase();
      if (userRole === "viewer") {
        return NextResponse.json({ error: "Viewers cannot create cards" }, { status: 403 });
      }
  
      const [insertResult] = await pool.execute(
        "INSERT INTO cards (board_id, list_id, title, description) VALUES (?, ?, ?, ?)",
        [boardId, listId, title, description || null]
      );
  
      return NextResponse.json({ message: "Card created", cardId: (insertResult as any).insertId }, { status: 201 });
    } catch (err) {
      console.error("Create card error:", err);
      return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
    }
  }