// /src/types/index.ts

export type Role = "Owner" | "Editor" | "Viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "Owner" | "Editor" | "Viewer";
}

export interface Board {
  id: number;
  name: string;
  lists: List[];
}

export interface List {
  id: number;
  name: string;
  cards: Card[];
}

export interface Card {
  id: number;
  list_id: number;
  board_id: number;
  title: string;
  description?: string;
  created_at?: Date;
}

export interface BoardUser {
  id: number;
  name: string;
  email: string;
  role: "Owner" | "Editor" | "Viewer";
}


export interface BoardUserRole {
  role: string;
}
export interface BoardUserLink {
  board_id: number;
  user_id: number;
  role: string;
}