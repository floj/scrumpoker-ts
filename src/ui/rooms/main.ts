import { io } from "socket.io-client";
import type { JoinRoomResponse } from "../../api/types";

const roomName = window.location.pathname.split("/").pop();

const joinResp = await fetch(`/api/rooms/${roomName}/join?create=true`, {
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
