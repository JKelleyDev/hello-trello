import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db"; // Your MySQL connection pool
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    // Query board_users joined with boards for the user's boards
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         bu.id AS board_user_id, 
         bu.board_id, 
         bu.role, 
         b.name AS board_name 
       FROM board_users bu
       INNER JOIN boards b ON bu.board_id = b.id
       WHERE bu.user_id = ?`,
      [decoded.userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ boards: [] }, { status: 200 }); // Empty array if no boards
    }

    // Format the response
    const boards = rows.map((row) => ({
      boardUserId: row.board_user_id,
      boardId: row.board_id,
      name: row.board_name,
      role: row.role,
    }));

    return NextResponse.json({ boards }, { status: 200 });
  } catch (err) {
    console.error("Boards route error:", {
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    console.log("🎯 HIT POST /api/boards route");
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    const { name } = await request.json();

    if (!name) {
      console.warn("⚠️ Board name missing in request.");
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      console.log("🚀 Creating new board...");

      // Insert board
      const [boardResult] = await conn.execute(
        "INSERT INTO boards (name) VALUES (?)",
        [name]
      );
      const boardId = (boardResult as any).insertId;
      console.log("🆕 Board created with ID:", boardId);

      // Insert board_users
      const [boardUserResult] = await conn.execute(
        "INSERT INTO board_users (user_id, board_id, role) VALUES (?, ?, 'owner')",
        [decoded.userId, boardId]
      );
      const boardUserId = (boardUserResult as any).insertId;
      console.log("👤 User assigned as owner with boardUserId:", boardUserId);

      // Insert default lists with logging
      try {
        console.log("Inserting default lists for board:", boardId);
        for (const listName of ["To Do", "In Progress", "Done"]) {
          console.log(`Inserting list: "${listName}"`);
          await conn.execute(
            "INSERT INTO lists (name, board_id) VALUES (?, ?)",
            [listName, boardId]
          );
        }
        console.log("Default lists successfully inserted.");
      } catch (listErr) {
        console.error("Failed to insert default lists:", listErr);
        throw listErr; // ensures rollback
      }

      await conn.commit();
      console.log("Board and lists committed successfully!");

      return NextResponse.json(
        {
          board: {
            boardId,
            name,
            boardUserId,
            role: "owner",
          },
        },
        { status: 201 }
      );
    } catch (err) {
      await conn.rollback();
      console.error("Error during board creation, rolling back:", err);
      return NextResponse.json(
        { error: "Failed to create board" },
        { status: 500 }
      );
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("POST /api/boards error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
