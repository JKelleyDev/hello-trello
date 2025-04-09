"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const socket = io();

export default function Dashboard() {
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCardTitles, setNewCardTitles] = useState<{ [key: number]: string }>({});
  const [boardUsers, setBoardUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Owner" | "Editor" | "Viewer">("Viewer");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState(""); // New state for board creation
  const router = useRouter();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch("/api/boards", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("Fetched boards:", JSON.stringify(data, null, 2));
        setBoards(data);
        setSelectedBoardId(data[0]?.id || null);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching boards:", error);
        setLoading(false);
      }
    };

    fetchBoards();

    socket.on("connect", () => console.log("Connected to Socket.IO"));
    socket.on("boardUpdate", (updatedBoard) => {
      setBoards((prev) =>
        prev.map((board) =>
          board.id === updatedBoard.id ? updatedBoard : board
        )
      );
    });

    return () => {
      socket.off("boardUpdate");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchBoardUsers = async () => {
      if (!selectedBoardId) return;
      try {
        const response = await fetch(`/api/board-users?boardId=${selectedBoardId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!response.ok) throw new Error("Failed to fetch board users");
        const data = await response.json();
        setBoardUsers(data.users);
        setUserRole(data.currentUserRole);
      } catch (error) {
        console.error("Error fetching board users:", error);
      }
    };
    fetchBoardUsers();
  }, [selectedBoardId]);

  const addCard = async (boardId: number, listId: number) => {
    if (userRole === "Viewer") return;
    const title = newCardTitles[listId];
    if (!title) return;
    const tempCard = { id: `temp-${Date.now()}`, board_id: boardId, list_id: listId, title };
    const updatedBoard = {
      ...boards.find((b) => b.id === boardId),
      lists: boards.find((b) => b.id === boardId)!.lists.map((list: any) =>
        list.id === listId ? { ...list, cards: [...list.cards, tempCard] } : list
      ),
    };
    setBoards((prev) =>
      prev.map((board) => (board.id === boardId ? updatedBoard : board))
    );
    setNewCardTitles((prev) => ({ ...prev, [listId]: "" }));

    try {
      const response = await fetch("/api/update-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ boardId, lists: updatedBoard.lists }),
      });
      const data = await response.json();
      if (data.updatedBoard) {
        setBoards((prev) =>
          prev.map((board) => (board.id === boardId ? data.updatedBoard : board))
        );
        socket.emit("updateBoard", data.updatedBoard);
      }
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const editCard = async (boardId: number, listId: number, cardId: number, newTitle: string) => {
    if (userRole === "Viewer") return;
    const updatedBoard = {
      ...boards.find((b) => b.id === boardId),
      lists: boards.find((b) => b.id === boardId)!.lists.map((list: any) =>
        list.id === listId
          ? {
              ...list,
              cards: list.cards.map((card: any) =>
                card.id === cardId ? { ...card, title: newTitle } : card
              ),
            }
          : list
      ),
    };
    updateBoards(updatedBoard);
  };

  const deleteCard = async (boardId: number, listId: number, cardId: number) => {
    if (userRole === "Viewer") return;
    const updatedBoard = {
      ...boards.find((b) => b.id === boardId),
      lists: boards.find((b) => b.id === boardId)!.lists.map((list: any) =>
        list.id === listId
          ? { ...list, cards: list.cards.filter((card: any) => card.id !== cardId) }
          : list
      ),
    };
    updateBoards(updatedBoard);
  };

  const onDragEnd = async (result: DropResult) => {
    if (userRole === "Viewer") return;
    const { source, destination } = result;
    if (!destination) return;

    const board = boards.find((b) => b.id === selectedBoardId);
    const sourceList = board.lists.find((list: any) => list.id === parseInt(source.droppableId));
    const destList = board.lists.find((list: any) => list.id === parseInt(destination.droppableId));

    if (!sourceList || !destList) return;

    const updatedBoard = { ...board };
    const [movedCard] = sourceList.cards.splice(source.index, 1);

    if (source.droppableId !== destination.droppableId) {
      movedCard.list_id = destList.id;
    }

    destList.cards.splice(destination.index, 0, movedCard);
    updateBoards(updatedBoard);
  };

  const updateBoards = async (updatedBoard: any) => {
    setBoards((prev) =>
      prev.map((board) => (board.id === updatedBoard.id ? updatedBoard : board))
    );
    socket.emit("updateBoard", updatedBoard);
    const response = await fetch("/api/update-board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ boardId: updatedBoard.id, lists: updatedBoard.lists }),
    });
    const data = await response.json();
    if (data.updatedBoard) {
      setBoards((prev) =>
        prev.map((board) => (board.id === data.updatedBoard.id ? data.updatedBoard : board))
      );
    }
  };

  const addBoardUser = async () => {
    if (userRole !== "Owner") return;
    try {
      const response = await fetch("/api/board-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ boardId: selectedBoardId, email: newUserEmail, role: newUserRole }),
      });
      if (response.ok) {
        const fetchResponse = await fetch(`/api/board-users?boardId=${selectedBoardId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await fetchResponse.json();
        setBoardUsers(data.users);
        setUserRole(data.currentUserRole);
        setNewUserEmail("");
        setNewUserRole("Viewer");
      } else {
        throw new Error("Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const response = await fetch("/api/create-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newBoardName }),
      });
      if (!response.ok) throw new Error("Failed to create board");
      const { board } = await response.json();
      setBoards((prev) => [...prev, board]);
      setSelectedBoardId(board.id); // Auto-select the new board
      setNewBoardName(""); // Clear input
    } catch (error) {
      console.error("Error creating board:", error);
      alert("Failed to create board");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket.disconnect();
    router.push("/login");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Trello Dashboard</h1>
      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2">
          {boards.length > 0 ? (
            <Select
              value={String(selectedBoardId)}
              onValueChange={(value) => setSelectedBoardId(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={String(board.id)}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No boards available</p>
          )}
          <Input
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="New board name"
            className="w-[180px]"
          />
          <Button onClick={createBoard}>Create Board</Button>
        </div>
        <div className="space-x-2">
          <Button onClick={() => router.push("/settings")} variant="outline">
            Settings
          </Button>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>
      {selectedBoardId && userRole === "Owner" && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Board Users</h3>
          <ul>
            {boardUsers.map((user) => (
              <li key={user.id}>{user.name} ({user.email}) - {user.role}</li>
            ))}
          </ul>
          <Input
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="User email to add"
            className="mt-2"
          />
          <Select
            value={newUserRole}
            onValueChange={(value) => setNewUserRole(value as "Owner" | "Editor" | "Viewer")}
          >
            <SelectTrigger className="w-[180px] mt-2">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Owner">Owner</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
              <SelectItem value="Viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addBoardUser} className="mt-2">Add User</Button>
        </div>
      )}
      {selectedBoardId ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div key={selectedBoardId}>
            <h2 className="text-xl font-semibold mb-4">
              {boards.find((b) => b.id === selectedBoardId)?.name}
            </h2>
            <div className="flex space-x-4 overflow-x-auto">
              {(boards.find((b) => b.id === selectedBoardId)?.lists || []).map((list: any) => (
                <Card key={list.id} className="w-72 flex-shrink-0 mb-4">
                  <CardHeader>
                    <CardTitle>{list.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Droppable droppableId={String(list.id)} isDropDisabled={userRole === "Viewer"}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="min-h-[100px]"
                        >
                          {(list.cards || []).map((card: any, index: number) => (
                            <Draggable
                              draggableId={String(card.id)}
                              index={index}
                              key={card.id}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-gray-100 p-2 mb-2 rounded shadow flex justify-between items-center"
                                  onDoubleClick={() => {
                                    if (userRole === "Viewer") return;
                                    const newTitle = prompt("Edit card title:", card.title);
                                    if (newTitle) editCard(selectedBoardId, list.id, card.id, newTitle);
                                  }}
                                >
                                  {card.title}
                                  {userRole !== "Viewer" && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteCard(selectedBoardId, list.id, card.id)}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                    {userRole !== "Viewer" && (
                      <>
                        <Input
                          value={newCardTitles[list.id] || ""}
                          onChange={(e) =>
                            setNewCardTitles((prev) => ({
                              ...prev,
                              [list.id]: e.target.value,
                            }))
                          }
                          placeholder="New card title"
                          className="mb-2"
                        />
                        <Button
                          onClick={() => addCard(selectedBoardId, list.id)}
                          className="w-full"
                        >
                          Add Card
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DragDropContext>
      ) : (
        <p>Create a board to get started!</p>
      )}
    </div>
  );
}