# Trello Board - Project Overview

## Application Configuration

- **Hosting Service:** Microsoft Azure – Static Web App  
- **Database:** Microsoft Azure – MySQL  
- **Framework:** Next.js  

## Dependencies

- `socket.io` – Real-time communication support  
- `shadcn` – UI Components  
- `TailwindCSS` – CSS Styling  
- `hello-pangea/dnd` – Drag and drop components
- `mysql2` - used for database connection / communication with MySQL db
- `axios` - used for making http request to api routes
- `jsonwebtoken (JWT)` - used to store user token on local storage for app authenication throughout use. Set for 1 hour exp.
- `react-dom` - allows for the UI to be rendered for client pages
- `lucid-react` - An icon library, so far just used for logout button icon

## Resources

- [Socket.IO](https://socket.io/how-to/use-with-nextjs)  
- [shadcn](https://ui.shadcn.com)  
- [Next.js](https://nextjs.org)  
- [hello-pangea/dnd](https://github.com/hello-pangea/dnd)  
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)  

## API Routes

| Method | Endpoint               | Description                            |
|--------|------------------------|----------------------------------------|
| GET    | `/api/boards`          | Fetch all boards for the user          |
| POST   | `/api/boards`          | Create a new board                     |
| GET    | `/api/boards/[boardId]/cards` | Gets all the cards for the baord with boardId   |
| POST   | `/api/boards/[boardId]/cards` | Adds card to baord with boardId |
| GET    | `/api/boards/[boardId]/lists` | Gets the lists 'to do' 'In Progress' and 'Done' for boardId|
| POST   | `/api/boards/[boardId]/lists` | Inserts the default lists when new board is created |
| GET    | `/api/boards/[boardId]/users` | Get the assigned users for the given board |
| POST   | `/api/boards/[boardId]/users` | Add a newly assigned user to the baord  |
| POST   | `/api/cards`                 |  Add card into card table in db upon creation|
| PUT    | `/api/cards/[cardId]`        | Called to update information for a editied card |
| DELETE | `/api/cards/[cardId]`        | Removes a card from db and relevant board/lists when deleted |
| POST   | `/api/login`                  | Authenicates user upon login, creates JWT and adds to local storage      |

## Socket.IO Events

### Client-to-Server Events

| Event Name    | Description                                         | Payload         |
|---------------|-----------------------------------------------------|-----------------|
| `cardCreated` | Triggered after a new card is added by a user. Informs other clients to refresh cards. | _None_ |
| `cardDeleted` | Triggered after a card is deleted by a user. Informs other clients to refresh cards.   | _None_ |
| `cardMoved`   | Triggered after a card is moved by a user. Informs other clients to refresh cards.     | _None_ |


```ts
// path: /src/app/dashboard/page.ts
socket.on("cardCreated", () => {
  refreshCards(); // Fetch updated cards from API
});

socket.on("cardDeleted", () => {
      refreshCards(); // fetch the updated cards for the selected board
    })

  // Refresh Card function, checks if user has a board on page then gets the updated cards for that board 
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
```

### Server-to-Client Events 
| Event Name    | Description                                         | Payload         |
|---------------|-----------------------------------------------------|-----------------|
| `cardCreated` | Broadcasted to all other connected clients. This should trigger a card refresh found in dashboard/page.tsx | _None_ |
| `cardDeleted` | Broadcasted to all other connected clients. This should trigger a card refresh found in dashboard/page.tsx   | _None_ |
| `cardMoved` | Broadcasted to all other connected clients. This should trigger a card refresh found in dashboard/page.tsx   | _None_ |

```ts
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("cardCreated", () => {
      console.log("cardCreated received");
      socket.broadcast.emit("cardCreated"); 
    });

    socket.on("cardDeleted", () => {
      console.log("cardDeleted received");
      socket.broadcast.emit("cardDeleted"); 
    });

    socket.on("cardMoved", () => {
      console.log("cardMoved received"); 
      socket.broadcast.emit("cardMoved"); 
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });

  });
```


---

## Local Development

Follow the steps below to run this project locally.

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or above recommended)  
- [MySQL](https://www.mysql.com) client (optional, for DB inspection)

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo

2. **Install Dependencies**

   ```bash
   npm install

3. **Set up enviromental variables**

   Create a `.env.local` file in the root directory with the following:

   ```env
   DB_HOST=url-to-your-database.com
   DB_USER=username
   DB_PASSWORD=P@$$WORD
   DB_NAME=db-name
   DB_PORT=3306
   JWT_SECRET=your-jwt-secret-key

4. **Run the development server**

    ```bash
    cd repo
    npm run dev


