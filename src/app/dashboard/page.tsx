"use client"; // Client Component

import { useState, useEffect, use } from "react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const socket = io(); 

export default function Dashboard() {

  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);
  const [boards, setBoards] = useState<
    { boardUserId: number; boardId: number; name: string; role: string }[]
  >([]);
  const [selectedBoard, setSelectedBoard] = useState<{
    boardId: number;
    name: string;
    role: string;
  } | null>(null);
  const [lists, setLists] = useState<{ id: number; name: string }[]>([]);
  const [cards, setCards] = useState<
    {
      id: number;
      board_id: number;
      list_id: number;
      title: string;
      description?: string;
    }[]
  >([]);
  const [error, setError] = useState<string>("");
  const [editingCard, setEditingCard] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [boardUsers, setBoardUsers] = useState<
    { id: number; name: string; email: string; role: string }[]
  >([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [creatingCard, setCreatingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDesc, setNewCardDesc] = useState("");
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/"); 
  };


  /////////////////////////////////////////////
  /////////// Socket Stuff ////////////////////
  const debouncedRefreshCards = debounce(() => {
  refreshCards();
}, 200); // 200ms delay

useEffect(() => {
  if (!selectedBoard) return;

  const handleCardCreated = () => {
    debouncedRefreshCards();
  };

  const handleCardDeleted = () => {
    debouncedRefreshCards();
  };

  const handleCardMoved = () => {
    debouncedRefreshCards();
  };

  socket.on("cardCreated", handleCardCreated);
  socket.on("cardDeleted", handleCardDeleted);
  socket.on("cardMoved", handleCardMoved);

  return () => {
    socket.off("cardCreated", handleCardCreated);
    socket.off("cardDeleted", handleCardDeleted);
    socket.off("cardMoved", handleCardMoved);
    debouncedRefreshCards.cancel(); // 🧹 Clean up debounce timers
  };
}, [selectedBoard]);



  const refreshCards = async () => {
    if (!selectedBoard?.boardId) {
      console.warn("No selected board ID, skipping refresh.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/boards/${selectedBoard.boardId}/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(res.data.cards);
    } catch (err) {
      console.error("Failed to refresh cards:", err);
    }
  };
  

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      setUser(JSON.parse(userString));
    } else {
      setError("No user data found. Please log in.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchBoards = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          return;
        }
        const response = await axios.get("/api/boards", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoards(response.data.boards);
        if (response.data.boards.length > 0) {
          setSelectedBoard({
            boardId: response.data.boards[0].boardId,
            name: response.data.boards[0].name,
            role: response.data.boards[0].role,
          });
        }
      } catch (err: any) {
        console.error("Error fetching boards:", err);
        setError(err.response?.data?.error || "Failed to load boards.");
      }
    };
    fetchBoards();
  }, [user]);

  useEffect(() => {
    if (!selectedBoard) {
      setLists([]);
      setCards([]);
      return;
    }
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          return;
        }

        const [listsResponse, cardsResponse] = await Promise.all([
          axios.get(`/api/boards/${selectedBoard.boardId}/lists`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/boards/${selectedBoard.boardId}/cards`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setLists(listsResponse.data.lists);
        setCards(cardsResponse.data.cards);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to load data.");
      }
    };
    const fetchBoardUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `/api/boards/${selectedBoard.boardId}/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBoardUsers(res.data.users);
      } catch (err) {
        console.error("Failed to fetch board users:", err);
      }
    };
    fetchBoardUsers();
    fetchData();
  }, [selectedBoard]);

  const handleInviteUser = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/boards/${selectedBoard?.boardId}/users`,
        { email: inviteEmail, role: inviteRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteOpen(false);

      // Refresh users after invite
      const res = await axios.get(
        `/api/boards/${selectedBoard?.boardId}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBoardUsers(res.data.users);
    } catch (err) {
      console.error("Failed to invite user:", err);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName || !user) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/boards",
        { name: newBoardName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newBoard = response.data.board;

      const updatedBoards = [
        ...boards,
        { ...newBoard, boardUserId: newBoard.boardUserId, role: "owner" },
      ];
      setBoards(updatedBoards);
      setSelectedBoard({
        boardId: newBoard.boardId,
        name: newBoard.name,
        role: "owner",
      });

      setNewBoardName("");
      setCreatingBoard(false);
    } catch (err: any) {
      console.error("Error creating board:", err);
      setError(err.response?.data?.error || "Failed to create board.");
    }
  };

  const onDragEnd = async (result: DropResult) => {
  const { source, destination } = result;
  if (!destination || source.droppableId === destination.droppableId) return;

  const movedCard = cards.find(
    (card) => card.id === parseInt(result.draggableId)
  );
  if (!movedCard) return;

  const updatedCards = cards.map((card) =>
    card.id === movedCard.id
      ? { ...card, list_id: parseInt(destination.droppableId) }
      : card
  );
  setCards(updatedCards);

  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `/api/cards/${movedCard.id}`,
      { listId: parseInt(destination.droppableId) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    socket.emit("cardMoved"); // 🚀 Now only emit if PUT succeeds
  } catch (err) {
    console.error("Error updating card position:", err);
    setError("Failed to update card position.");
    setCards(cards); // Revert cards if error
  }
};

  const handleEditCard = async () => {
    if (!editingCard) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/cards/${editingCard.id}`,
        { title: editingCard.title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCards(
        cards.map((card) =>
          card.id === editingCard.id
            ? { ...card, title: editingCard.title }
            : card
        )
      );
      setEditingCard(null);
    } catch (err) {
      console.error("Error editing card:", err);
      setError("Failed to edit card.");
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(cards.filter((card) => card.id !== cardId));
      socket.emit("cardDeleted");
    } catch (err) {
      console.error("Error deleting card:", err);
      setError("Failed to delete card.");
    }
  };

  if (!user) {
    return <div className="p-4 text-red-500">{error || "Please log in"}</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {selectedBoard
                ? `${selectedBoard.name} (${selectedBoard.role})`
                : "Select a Board"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Your Boards</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {boards.length > 0 ? (
              boards.map((board) => (
                <DropdownMenuItem
                  key={board.boardUserId}
                  onClick={() =>
                    setSelectedBoard({
                      boardId: board.boardId,
                      name: board.name,
                      role: board.role,
                    })
                  }
                >
                  {board.name} ({board.role})
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No boards found</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />

            {/* Create Board Dialog Trigger */}
            <Dialog open={creatingBoard} onOpenChange={setCreatingBoard}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Create Board
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Board</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Board Name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                />
                <Button onClick={handleCreateBoard} className="mt-2">
                  Create
                </Button>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TooltipProvider>
        <div className="flex items-center space-x-2 mb-4">
          {boardUsers.map((u) => (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 text-white font-semibold">
                    {u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                {u.name} ({u.role})
              </TooltipContent>
            </Tooltip>
          ))}

          {/* ➕ Add User Button Avatar */}
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition">
                +
              </button>
            </DialogTrigger>
          </Dialog>
        </div>
      </TooltipProvider>
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a User to this Board</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="User email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="mb-2"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="mb-2">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInviteUser}>Send Invite</Button>
        </DialogContent>
      </Dialog>

      {["Owner", "Editor"].includes(selectedBoard?.role || "") && (
        <Button onClick={() => setCreatingCard(true)} className="mb-4">
          + Add Card
        </Button>
      )}

      <Dialog open={creatingCard} onOpenChange={setCreatingCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Card</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Card Title"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            className="mb-2"
          />
          <Input
            placeholder="Description (optional)"
            value={newCardDesc}
            onChange={(e) => setNewCardDesc(e.target.value)}
            className="mb-4"
          />
          <Button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");

                // Find the 'To Do' list by name
                const todoList = lists.find(
                  (l) => l.name.toLowerCase() === "to do"
                );

                if (!todoList) {
                  alert("No 'To Do' list found on this board.");
                  return;
                }

                await axios.post(
                  `/api/cards`,
                  {
                    title: newCardTitle,
                    description: newCardDesc,
                    boardId: selectedBoard?.boardId,
                    listId: todoList.id,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                // Emits that a card was created 
                socket.emit("cardCreated");

                setNewCardTitle("");
                setNewCardDesc("");
                setCreatingCard(false);

                // Refresh cards
                const res = await axios.get(
                  `/api/boards/${selectedBoard?.boardId}/cards`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                setCards(res.data.cards);
              } catch (err) {
                console.error("Error adding card:", err);
                setError("Failed to add card.");
              }
            }}
          >
            Add Card
          </Button>
        </DialogContent>
      </Dialog>

      {selectedBoard && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-4">
            {lists.map((list) => (
              <Droppable droppableId={list.id.toString()} key={list.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 bg-white p-4 rounded-lg shadow-md min-h-[300px]"
                  >
                    <h2 className="text-xl font-semibold mb-4">{list.name}</h2>
                    {cards
                      .filter((card) => card.list_id === list.id)
                      .map((card, index) => (
                        <Draggable
                          key={card.id}
                          draggableId={card.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2"
                            >
                              <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {card.title}
                                  </span>
                                  {card.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {card.description}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() =>
                                          setEditingCard({
                                            id: card.id,
                                            title: card.title,
                                          })
                                        }
                                      >
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Card</DialogTitle>
                                      </DialogHeader>
                                      <Input
                                        value={editingCard?.title || ""}
                                        onChange={(e) =>
                                          setEditingCard(
                                            editingCard
                                              ? {
                                                  ...editingCard,
                                                  title: e.target.value,
                                                }
                                              : null
                                          )
                                        }
                                        placeholder="Card Title"
                                      />
                                      <Button onClick={handleEditCard}>
                                        Save
                                      </Button>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCard(card.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {cards.filter((card) => card.list_id === list.id).length ===
                      0 && <div className="text-gray-500">No tasks yet</div>}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
