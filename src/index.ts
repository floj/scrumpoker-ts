import { Hono } from "hono";
import { Server as Engine } from "@socket.io/bun-engine";
import { newRoomsApi } from "./api/rooms";
import HomeView from "./ui/home/index.html";
import RoomView from "./ui/rooms/index.html";

const engine = new Engine();
const { websocket } = engine.handler();

const roomsApi = newRoomsApi("/api/rooms", engine);

const server = Bun.serve({
  port: 3000,
  idleTimeout: 30,
  routes: {
    "/": HomeView,
    "/rooms/:roomName": RoomView,
    "/socket.io/": (req, server) => engine.handleRequest(req, server),
    "/api/health": new Response("OK"),
    "/api/rooms/*": roomsApi.fetch,
  },
  fetch: () => new Response("bun not found", { status: 404 }),
  websocket,
});

console.log(`Server is running on ${server.url}`);
