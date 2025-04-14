import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db"; // Import the pool
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate environment variables
    const requiredEnvVars = [
      "DB_HOST",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "DB_PORT",
      "JWT_SECRET",
    ];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} is not defined`);
      }
    }

    // Use the pool to execute the query, now including 'name'
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, email, name, password FROM users WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    //const validPassword = await bcrypt.compare(password, user.password); // To be implemented later with password hashing
    const validPassword = password === user.password;

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name }, // Include name in token payload (optional)
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }, // Include name in response
    });
  } catch (err) {
    console.error("Login route error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
