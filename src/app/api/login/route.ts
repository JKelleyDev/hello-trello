import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate environment variables
    if (!process.env.DATABASE_CONNECTION_STRING) {
      throw new Error("DATABASE_CONNECTION_STRING is not defined");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const connection = await mysql.createConnection(process.env.DATABASE_CONNECTION_STRING);

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT id, email, password FROM users WHERE email = ?",
        [email]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return NextResponse.json({
        token,
        user: { id: user.id, email: user.email },
      });
    } finally {
      await connection.end();
    }
  } catch (err) {
    console.error("Login route error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}