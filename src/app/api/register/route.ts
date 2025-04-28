import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db"; 

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    } 

    // Check for existing user
    const [existingRows]: any = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingRows.length > 0) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    // Insert new user
    const [insertResult]: any = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );

    const userId = insertResult.insertId;

    // Create token
    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const newUser = {
      id: userId,
      name,
      email,
    };

    return NextResponse.json({ user: newUser, token }, { status: 201 });

  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
