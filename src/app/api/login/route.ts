import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Use DAB REST endpoint to fetch user by email
    const dabBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://your-static-app-name.azurestaticapps.net";
    const restUrl = `${dabBaseUrl}/rest/users?filter=email eq ${encodeURIComponent(email)}`;
    
    const response = await fetch(restUrl, {
      method: "GET",
      headers: {
        "x-ms-api-role": "authenticated", // Assumes Static Web Apps auth
      },
    });

    if (!response.ok) {
      throw new Error(`REST API error: ${response.statusText}`);
    }

    const users = await response.json();
    if (!users.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
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
  } catch (err) {
    console.error("Login route error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}