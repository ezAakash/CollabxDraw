<div align="center">
  <h1>🎨 CollabxDraw</h1>
  <p><strong>A Real-Time Collaborative Drawing Application</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
  [![Turborepo](https://img.shields.io/badge/Built_with-Turborepo-EF4444?logo=turborepo)](https://turbo.build/)
</div>

<br />

CollabxDraw is a modern, real-time whiteboarding and collaborative drawing application. Inspired by concepts from popular whiteboarding tools, it allows users to create password-protected rooms, share ideas visually, and simultaneously draw together in real time over WebSockets.

Whether you're brainstorming, wireframing, or just doodling with friends, CollabxDraw provides a seamless and visually stunning experience.

---

## ✨ Features

- **Real-Time Collaboration**: See what others are drawing instantly, powered by a robust WebSockets implementation.
- **Password-Protected Rooms**: Keep your brainstorming sessions private and secure. 
- **Rich Drawing Toolkit**: Draw shapes, lines, arrows, and add text with customizable stroke widths, opacities, and colors.
- **Persistent Canvases**: All drawings and elements are securely saved to a PostgreSQL database, so you never lose your progress.
- **User Authentication**: Sign up, log in, and easily manage access to your creative spaces.
- **Production Ready**: Fully containerized with Docker, making deployment across different environments seamless.

---

## 🏗️ Architecture

CollabxDraw is engineered as a modern **Monorepo** using **Turborepo** and **pnpm workspaces**. This structure allows for excellent code sharing and caching across multiple frontend and backend services.

### Core Structure

```text
CollabxDraw/
├── apps/
│   ├── frontend/         # React 19 + Vite web application
│   ├── http-backend/     # Express.js REST API for auth and room initialization 
│   └── ws-backend/       # WebSockets server for real-time canvas synchronization
├── packages/
│   ├── db/               # Prisma ORM and PostgreSQL schema
│   ├── backend-common/   # Shared types, Zod validation schemas, and auth utilities
│   ├── ui/               # Reusable React UI components
│   ├── eslint-config/    # Shared linting config
│   └── typescript-config/# Shared TSconfig bases
└── docker/               # Dockerfiles for containerized microservices deployment
```

### How It Works Under The Hood

1. **Authentication & Room Access (`http-backend`)**
   Users log in or sign up via the Express REST API that handles JWT authentication and password hashing (bcrypt). When joining a room, users authenticate to ensure they have the proper permissions and the room password.
   
2. **Initial Canvas Sync (`http-backend`)**
   Before starting the real-time session, the frontend fetches the current state of all drawing elements for that specific room via an HTTP endpoint (`/room/:id/elements`). This ensures lightning-fast initial load times.

3. **Real-Time Synchronization (`ws-backend`)**
   Once the initial canvas is loaded, the client establishes a persistent WebSocket connection. As users draw, update text, or change properties (like color or opacity), lightweight events are broadcasted to all other connected clients, ensuring everyone's screen is in perfect sync.

4. **Data Persistence (`packages/db`)**
   The canvas state is persisted to a PostgreSQL database managed via Prisma ORM.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18 or higher)
- pnpm (v9.0.0+)
- PostgreSQL (or Docker to run postgres locally)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/collabxdraw.git
   cd collabxdraw
   ```

2. **Install all dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables:**
   - Create `.env` files in your respective apps (`apps/http-backend`, `apps/ws-backend`, `apps/frontend`) and the `packages/db` directory.
   - Example Database URL: `DATABASE_URL="postgresql://user:password@localhost:5432/collabxdraw"`

4. **Initialize Database:**
   ```bash
   # Generates Prisma client and applies migrations
   pnpm run generate:db
   ```

5. **Start the Development Server:**
   ```bash
   # This will spin up the frontend, http-backend, and ws-backend concurrently
   pnpm run dev
   ```

You are ready to draw! Open `http://localhost:5173` in your browser.

---

## 🐳 Docker Deployment

CollabxDraw is built to be deployed via Docker. 
Check out the `docker/` directory for production-ready, multi-stage Dockerfiles optimized for fast build times and low image sizes for both the frontend static server and backend node applications.

## 🛠️ Built With

- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express.js, TypeScript, ws (WebSockets)
- **Database:** PostgreSQL, Prisma ORM
- **Tooling:** Turborepo, pnpm workspaces, ESLint, Prettier, Docker

---

<p align="center">
  <i>Built with ❤️</i>
</p>