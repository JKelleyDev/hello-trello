// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import pool from "@/lib/db"; // adjust based on your setup

// const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// export async function POST(req: NextRequest) {
//   try {
//     const { name, email, password } = await req.json();

//     if (!name || !email || !password) {
//       return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
//     }

//     // Check if user already exists
//     const [existingUser] = await pool.query(
//       "SELECT * FROM users WHERE email = ?",
//       [email]
//     );

//     if ((existingUser as any[]).length > 0) {
//       return NextResponse.json({ error: "User already exists." }, { status: 409 });
//     }

//     // Hash password
//     const saltRounds = 10;
//     const password_hash = await bcrypt.hash(password, saltRounds);

//     // Insert new user
//     const [result]: any = await pool.query(
//       "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
//       [name, email, password_hash]
//     );

//     const userId = result.insertId;

//     // Generate JWT
//     const token = jwt.sign({ id: userId, email }, JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     const newUser = { id: userId, name, email };

//     return NextResponse.json({ user: newUser, token });
//   } catch (err: any) {
//     console.error("Register API error:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
