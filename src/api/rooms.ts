import { Hono } from "hono";
import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";

import {
  Player,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type VoteRequest,
} from "./types";
import { Room } from "./types";

import { defaultCards } from "./constants";
import { faker, pl } from "@faker-js/faker";

function newRoomName() {
  return faker.food.dish();
}

function newRoomsApi(engine: Engine): Hono {
  const rooms = new Map<string, Room>();

  const io = new Server();
  io.bind(engine);

  io.on("connection", (socket) => {
    const roomName = socket.handshake.headers["roomname"] as string | undefined;
    const authToken = socket.handshake.headers["x-token"] as string | undefined;
    console.log("Socket connection attempt", socket.handshake.headers);

    if (roomName === undefined) {
      console.log("Client connected, roomName missing");
      return;
    }
    if (authToken === undefined) {
      console.log("Client connected, authToken missing");
      return;
    }

    const room = rooms.get(roomName);
    if (room === undefined) {
      console.log("Client connected, room not found", { roomName });
      return;
    }

    const player = room.playerByAuthToken(authToken);
    if (player === undefined) {
      console.log("Client connected, player not found in room", {
        roomName,
        authToken,
      });
      return;
    }

    socket.data.player = player;
    socket.join(roomName);

    console.log("Client connected", {
      socketId: socket.id,
      roomName,
      playerId: player.id,
      playerName: player.name,
    });
  });

  const api = new Hono();

  api.post("/", (c) => {
    let name = newRoomName();
    for (let i = 0; i < 10; i++) {
      if (!rooms.has(name)) {
        break;
      }
      name = newRoomName();
    }
    if (rooms.has(name)) {
      return c.json({ error: "Failed to generate unique room name" }, 500);
    }
    const room = new Room(name, defaultCards);
    rooms.set(room.name, room);
    return c.redirect(`/rooms/${room.name}`);
  });

  api.get("/:id", (c) => {
    const { id } = c.req.param();
    const room = rooms.get(id);
    if (room === undefined) {
      return c.json({ error: "Room not found" }, 404);
    }
    return c.json(room.asResponse());
  });

  api.post("/:id/join", async (c) => {
    const { id } = c.req.param();
    const { create } = c.req.query();

    let room = rooms.get(id);
    if (room === undefined) {
      if (create !== "true") {
        return c.json({ error: "Room not found" }, 404);
      }
      room = new Room(id, defaultCards);
      rooms.set(room.name, room);
    }

    const req = (await c.req.json()) as JoinRoomRequest;

    let player = room.playerByAuthToken(req.authToken);

    const rejoined = player !== undefined;
    if (player === undefined) {
      player = new Player(req.username);
      room.addPlayer(player);
    }

    console.log("Player joined", {
      roomName: room.name,
      playerId: player.id,
      playerName: player.name,
      rejoined,
    });

    io.to(room.name).emit("roomUpdate", room.asResponse());

    return c.json({
      username: player.name,
      authToken: player.authToken,
      playerId: player.id,
      room: room.asResponse(),
      selectedCard: player.card,
    } as JoinRoomResponse);
  });

  api.post("/:id/vote", async (c) => {
    const { id } = c.req.param();
    const authToken = c.req.header("X-Token");

    const room = rooms.get(id);
    if (room === undefined) {
      return c.json({ error: "Room not found" }, 404);
    }

    const player = room.playerByAuthToken(authToken);
    if (player === undefined) {
      return c.json({ error: "Invalid auth token" }, 403);
    }

    const req = (await c.req.json()) as VoteRequest;

    if (!room.allowedCards.includes(req.card)) {
      return c.json({ error: "Card not allowed in this room" }, 400);
    }

    room.vote(player.id, req.card);
    console.log("Player voted", {
      roomName: room.name,
      playerId: player.id,
      playerName: player.name,
      card: player.card,
    });
    io.to(room.name).emit("roomUpdate", room.asResponse());
    return c.status(204);
  });

  api.post("/:id/reveal", async (c) => {
    const { id } = c.req.param();
    const authToken = c.req.header("X-Token");

    const room = rooms.get(id);
    if (room === undefined) {
      return c.json({ error: "Room not found" }, 404);
    }

    const player = room.playerByAuthToken(authToken);
    if (player === undefined) {
      return c.json({ error: "Invalid auth token" }, 403);
    }

    room.reveal();

    console.log("Room revealed", {
      playerId: player.id,
      playerName: player.name,
      roomName: room.name,
    });
    io.to(room.name).emit("roomUpdate", room.asResponse());
    return c.status(204);
  });

  api.post("/:id/reset", async (c) => {
    const { id } = c.req.param();
    const authToken = c.req.header("X-Token");

    const room = rooms.get(id);
    if (room === undefined) {
      return c.json({ error: "Room not found" }, 404);
    }

    const player = room.playerByAuthToken(authToken);
    if (player === undefined) {
      return c.json({ error: "Invalid auth token" }, 403);
    }

    room.reset();

    console.log("Room reset", {
      playerId: player.id,
      playerName: player.name,
      roomName: room.name,
    });
    io.to(room.name).emit("roomUpdate", room.asResponse());
    return c.status(204);
  });

  return api;
}

export { newRoomsApi };
