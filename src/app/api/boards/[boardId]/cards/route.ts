import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

// Here we assume that the context object provides params as a Promise,
// even though Next.js normally supplies params synchronously.
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ boardId: string }>;
    searchParams: { [key: string]: string | string[] | undefined };
  }
) {
  // Await the params from the Promise wrapper
  const resolvedParams = await context.params;
  const boardId = parseInt(resolvedParams.boardId, 10);
  if (isNaN(boardId)) {
    return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const [accessCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT 1 FROM board_users WHERE user_id = ? AND board_id = ?",
      [decoded.userId, boardId]
    );
    if (!accessCheck || (Array.isArray(accessCheck) && accessCheck.length === 0)) {
      return NextResponse.json({ error: "Unauthorized access to this board" }, { status: 403 });
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, board_id, list_id, title, description FROM cards WHERE board_id = ?",
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

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ boardId: string }>;
    searchParams: { [key: string]: string | string[] | undefined };
  }
) {
  const resolvedParams = await context.params;
  const boardId = parseInt(resolvedParams.boardId, 10);
  if (isNaN(boardId)) {
    return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const { title, listId } = await request.json();
    if (!title || !listId) {
      return NextResponse.json({ error: "Title and listId are required" }, { status: 400 });
    }

    const [accessCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT role FROM board_users WHERE user_id = ? AND board_id = ?",
      [decoded.userId, boardId]
    );
    if (!accessCheck || (Array.isArray(accessCheck) && accessCheck.length === 0)) {
      return NextResponse.json({ error: "Unauthorized access to this board" }, { status: 403 });
    }
    if (accessCheck[0].role === "Viewer") {
      return NextResponse.json({ error: "Viewers cannot create cards" }, { status: 403 });
    }

    const [result] = await pool.execute(
      "INSERT INTO cards (board_id, list_id, title) VALUES (?, ?, ?)",
      [boardId, listId, title]
    );

    const newCardId = (result as any).insertId;

    return NextResponse.json(
      { card: { id: newCardId, board_id: boardId, list_id: listId, title } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create card error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
