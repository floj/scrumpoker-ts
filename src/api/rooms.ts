import { Hono } from "hono";
import { logger } from "hono/logger";
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
import { faker } from "@faker-js/faker";

function newRoomName() {
  return faker.food.dish();
}

function newRoomsApi(base: string, engine: Engine): Hono {
  const rooms = new Map<string, Room>();

  const io = new Server();
  io.bind(engine);

  io.on("connection", (socket) => {
    const roomName = socket.handshake.headers["roomname"] as string | undefined;
    const authToken = socket.handshake.headers["x-token"] as string | undefined;
    // console.log("Socket connection attempt", socket.handshake.headers);

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
  api.use(logger());

  api.post(`${base}/`, (c) => {
    if (rooms.size >= 100) {
      return c.json({ error: "Maximum number of rooms reached" }, 503);
    }

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

  api.get(`${base}/:id`, (c) => {
    const { id } = c.req.param();
    const room = rooms.get(id);
    if (room === undefined) {
      return c.json({ error: "Room not found" }, 404);
    }
    return c.json(room.asResponse());
  });

  api.post(`${base}/:id/join`, async (c) => {
    const { id } = c.req.param();
    const { create } = c.req.query();

    let room = rooms.get(id);
    console.log("Join room attempt", { roomName: id, create, room });
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
      player = new Player();
      room.addPlayer(player);
    }
    player.name = req.username ?? "";
    if (player.name === "") {
      player.name = faker.person.fullName();
    }
    if (player.name.length > 40) {
      player.name = player.name.slice(0, 37) + "...";
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

  api.post(`${base}/:id/vote`, async (c) => {
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
    console.log("Vote attempt", { req });
    if (req.card !== null && !room.allowedCards.includes(req.card)) {
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
    c.status(204);
    return c.text("");
  });

  api.post(`${base}/:id/reveal`, async (c) => {
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
    c.status(204);
    return c.text("");
  });

  api.post(`${base}/:id/reset`, async (c) => {
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
    io.to(room.name).emit("roomUpdate", room.asResponse(true));
    c.status(204);
    return c.text("");
  });

  // run room cleanup every 5 minutes, removing rooms that have been inactive
  setInterval(
    () => {
      try {
        const rr = Array.from(rooms.values());
        for (const room of rr) {
          if (room.cleanup()) {
            console.log("Removing inactive room", { roomName: room.name });
            rooms.delete(room.name);
          }
        }
      } catch (err) {
        console.error("Error during room cleanup", err);
      }
    },
    5 * 60 * 1000,
  );

  return api;
}

export { newRoomsApi };
