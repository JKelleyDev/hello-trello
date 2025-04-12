import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "No token provided" }, { status: 401 });
      }
  
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET!);
  
      const url = new URL(request.url);
      const boardId = url.pathname.split("/").findLast((seg) => seg !== "users");
  
      if (!boardId) {
        return NextResponse.json({ error: "Board ID not found in URL" }, { status: 400 });
      }
  
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT u.id, u.name, u.email, bu.role
         FROM board_users bu
         INNER JOIN users u ON bu.user_id = u.id
         WHERE bu.board_id = ?`,
        [boardId]
      );
  
      return NextResponse.json({ users: rows }, { status: 200 });
    } catch (err) {
      console.error("GET board users error:", err);
      return NextResponse.json({ error: "Failed to fetch board users" }, { status: 500 });
    }
  }

  export async function POST(request: NextRequest) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "No token provided" }, { status: 401 });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  
      const { email, role } = await request.json();
  
      const url = new URL(request.url);
      const boardId = url.pathname.split("/").findLast((seg) => seg !== "users");
  
      if (!email || !role || !boardId) {
        return NextResponse.json({ error: "Email, role, and board ID are required" }, { status: 400 });
      }
  
      const conn = await pool.getConnection();
  
      try {
        // Check if user exists
        const [userRows] = await conn.execute<RowDataPacket[]>(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );
  
        if (userRows.length === 0) {
          return NextResponse.json(
            { error: "User does not exist. Invite system coming soon!" },
            { status: 404 }
          );
        }
  
        const userId = userRows[0].id;
  
        // Check if already assigned
        const [existingRows] = await conn.execute<RowDataPacket[]>(
          "SELECT * FROM board_users WHERE board_id = ? AND user_id = ?",
          [boardId, userId]
        );
  
        if (existingRows.length > 0) {
          return NextResponse.json(
            { message: "User is already assigned to this board." },
            { status: 200 }
          );
        }
  
        // Add user to board
        await conn.execute(
          "INSERT INTO board_users (user_id, board_id, role) VALUES (?, ?, ?)",
          [userId, boardId, role]
        );
  
        return NextResponse.json({ message: "User added to board." }, { status: 201 });
      } catch (err) {
        console.error("POST board user error:", err);
        return NextResponse.json({ error: "Failed to add user to board" }, { status: 500 });
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error("POST board users error:", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }