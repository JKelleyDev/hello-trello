import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    // Await the params promise before using cardId
    const resolvedParams = await context.params;
    const cardId = parseInt(resolvedParams.cardId, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    const { title, listId } = await request.json();
    if (!title && !listId) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    const [cardCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT board_id FROM cards WHERE id = ?",
      [cardId]
    );
    if (!cardCheck || cardCheck.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const boardId = cardCheck[0].board_id;
    const [accessCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT role FROM board_users WHERE user_id = ? AND board_id = ?",
      [decoded.userId, boardId]
    );
    if (!accessCheck || accessCheck.length === 0) {
      return NextResponse.json(
        { error: "Unauthorized access to this board" },
        { status: 403 }
      );
    }
    if (accessCheck[0].role === "Viewer") {
      return NextResponse.json(
        { error: "Viewers cannot edit cards" },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];
    if (title) {
      updates.push("title = ?");
      values.push(title);
    }
    if (listId) {
      updates.push("list_id = ?");
      values.push(listId);
    }
    values.push(cardId);

    await pool.execute(
      `UPDATE cards SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({ message: "Card updated" }, { status: 200 });
  } catch (err) {
    console.error("Update card error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    // Await the params promise before using cardId
    const resolvedParams = await context.params;
    const cardId = parseInt(resolvedParams.cardId, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    const [cardCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT board_id FROM cards WHERE id = ?",
      [cardId]
    );
    if (!cardCheck || cardCheck.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const boardId = cardCheck[0].board_id;
    const [accessCheck] = await pool.execute<RowDataPacket[]>(
      "SELECT role FROM board_users WHERE user_id = ? AND board_id = ?",
      [decoded.userId, boardId]
    );
    if (!accessCheck || accessCheck.length === 0) {
      return NextResponse.json(
        { error: "Unauthorized access to this board" },
        { status: 403 }
      );
    }
    if (accessCheck[0].role === "Viewer") {
      return NextResponse.json(
        { error: "Viewers cannot delete cards" },
        { status: 403 }
      );
    }

    await pool.execute("DELETE FROM cards WHERE id = ?", [cardId]);

    return NextResponse.json({ message: "Card deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete card error:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
