// src/lib/api.ts
export async function getBoardsForUser(userId: number) {
    const res = await fetch(`/api/boards/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch boards');
    return res.json();
  }
  
  export async function getBoardData(boardId: number) {
    const res = await fetch(`/api/boards/${boardId}`);
    if (!res.ok) throw new Error('Failed to fetch board data');
    return res.json();
  }
  