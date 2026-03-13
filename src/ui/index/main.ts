import { io } from "socket.io-client";
import type { CreateRoomResponse, JoinRoomResponse } from "../../api/types";

async function createRoom() {
  const createRoomResp = await fetch("/api/rooms", {
    method: "POST",
  });

  if (!createRoomResp.ok) {
    throw new Error("Failed to create room");
  }

  const createRoomBody = (await createRoomResp.json()) as CreateRoomResponse;
  return createRoomBody.name;
}

const roomName = await createRoom();

const joinResp = await fetch(`/api/rooms/${roomName}/join`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});

if (!joinResp.ok) {
  throw new Error("Failed to join room");
}

const joinBody = (await joinResp.json()) as JoinRoomResponse;

const socket = io({
  extraHeaders: {
    roomName: joinBody.room.name,
    "x-token": joinBody.authToken,
  },
});

socket.on("connect", () => {
  console.log("Connected to server");
});
