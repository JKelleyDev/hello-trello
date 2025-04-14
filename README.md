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

### Resources

- [Socket.IO](https://socket.io/how-to/use-with-nextjs)  
- [shadcn](https://ui.shadcn.com)  
- [Next.js](https://nextjs.org)  
- [hello-pangea/dnd](https://github.com/hello-pangea/dnd)  
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)  

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

   Create a .env.local file in the root directory with the following:

   DB_HOST: url-to-your-database.com
   DB_USER: username 
   DB_PASSWORD: P@$$WORD
   DB_NAME: db-name
   DB_PORT: 3306 (Typically 3306)
   JWT_SECRET: Same as you have set in your app .env

4. **Run the development server**

    ```bash
    cd repo
    npm run dev


