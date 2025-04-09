import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket} from "mysql2";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      port: 3306,
      ssl: { rejectUnauthorized: false }
    });

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
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );

      return NextResponse.json({
        token,
        user: { id: user.id, email: user.email },
      });

    } catch (dbError) {
      console.error("Database query failed:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    } finally {
      await connection.end();
    }

  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
