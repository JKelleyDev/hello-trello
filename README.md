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
| GET    | `/api/boards/[boardId]/cards` |                                  |
| POST   | `/api/boards/[boardId]/cards` |                                  |
| GET    | `/api/boards/[boardId]/lists` |                                  |
| POST   | `/api/boards/[boardId]/lists` |                                  |
| GET    | `/api/boards/[boardId]/users` |                                  |
| POST   | `/api/boards/[boardId]/users` |                                  |
| POST   | `/api/cards`                 |                                  |
| PUT    | `/api/cards/[cardId]`        |                                  |
| DELETE | `/api/cards/[cardId]`        |                                  |
| POST   | `/api/login`                  |                                  |


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


