# 🃏 no-fuzz estimates

A real-time **planning poker** app for agile teams. Create a room, share the link, pick your cards, and reveal estimates together — no sign-up required.

Built with **Bun**, **Hono**, **Socket.IO**, and **Bulma**.

---

## ✨ Features

- 🏠 **Instant rooms** — one click creates a room with a random name
- 🔗 **Shareable links** — copy the room URL and invite your team
- 🎴 **Modified Fibonacci cards** — `0 1 2 3 5 8 13 20 40 100 ❓ ☕`
- 👀 **Hidden votes** — card values stay secret until someone reveals
- 🔄 **Reveal & reset** — any player can reveal or start a new round
- ⚡ **Real-time sync** — votes and state updates instantly via WebSockets
- 🌗 **Theme picker** — light, dark, or system preference
- 🔁 **Reconnection** — refresh the page and pick up right where you left off
- 🍝 **Fun room names** — powered by Faker (random food dishes!)

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1+

### Install & Run

```sh
bun install
bun run dev
```

Open 👉 http://localhost:3000

---

## 🐳 Docker

```sh
docker build -t scrumpoker-ts .
docker run -p 3000:3000 scrumpoker-ts
```

---

## 📡 API

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| `POST` | `/api/rooms/`           | 🆕 Create a new room     |
| `GET`  | `/api/rooms/:id`        | 📋 Get room state        |
| `POST` | `/api/rooms/:id/join`   | 🚪 Join a room           |
| `POST` | `/api/rooms/:id/vote`   | 🗳️ Submit or change vote |
| `POST` | `/api/rooms/:id/reveal` | 👁️ Reveal all votes      |
| `POST` | `/api/rooms/:id/reset`  | 🔄 Reset for next round  |
| `GET`  | `/api/health`           | 💚 Health check          |

---

## 📝 License

MIT
