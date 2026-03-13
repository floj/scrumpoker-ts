import { Hono } from "hono";
import { Server as Engine } from "@socket.io/bun-engine";
import { newRoomsApi } from "./api/rooms";
import index from "./ui/index/index.html";
import roomUi from "./ui/rooms/index.tsx";


const engine = new Engine();
const { websocket } = engine.handler();

const app = new Hono();

const roomsApi = newRoomsApi(engine);
app.route("/api/rooms", roomsApi);

const server = Bun.serve({
  port: 3000,
  idleTimeout: 30,
  routes: {
    "/": index,
    "/rooms/:roomName": roomUi,
    "/socket.io/": (req, server) => engine.handleRequest(req, server),
    "/api/health": new Response("OK"),
  },
  fetch: app.fetch,
  websocket,
});

console.log(`Server is running on ${server.url}`);
