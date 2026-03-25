import { useEffect, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import { io } from "socket.io-client";

import type { JoinRoomResponse, RoomUpdate } from "../../api/types";
import { RoomService } from "./roomService";
import UsernameInput from "./components/UsernameInput";
import CardSelector from "./components/CardSelector";
import PlayerList from "./components/PlayerList";

import "js-toast-notifier/dist/toast.css";
import "./index.css";
import "bulma/css/bulma.css";

import RoomActions from "./components/RoomActions";
import Settings from "./components/Settings";
import { toaster } from "./toaster";

const roomName = decodeURIComponent(window.location.pathname.split("/").pop()!);
const usernameFromStorage = localStorage.getItem(`username`) ?? "";

let authToken = localStorage.getItem(`token-${roomName}`) ?? "";
const authTokenProvider = () => {
  return authToken;
};

const roomService = new RoomService("/api", roomName, authTokenProvider);

const joinInfo = await roomService.joinRoom(usernameFromStorage, true);
authToken = joinInfo.authToken;

function App() {
  const [username, setUsername] = useState(joinInfo.username);
  const [selectedCard, setSelectedCard] = useState(joinInfo.selectedCard);

  const [allowedCards, setAllowedCards] = useState(joinInfo.room.allowedCards);
  const [revealed, setRevealed] = useState(joinInfo.room.revealed);
  const [players, setPlayers] = useState(joinInfo.room.players);

  function updateJoinInfo(joinInfo: JoinRoomResponse) {
    authToken = joinInfo.authToken;

    localStorage.setItem(`username`, joinInfo.username);
    localStorage.setItem(`token-${roomName}`, authToken);

    setUsername(joinInfo.username);
    setSelectedCard(joinInfo.selectedCard);
  }

  async function updateUsername(newUsername: string) {
    const joinInfo = await roomService.joinRoom(newUsername, true);
    updateJoinInfo(joinInfo);
  }

  async function updateSelectedCard(card: string) {
    const newCard = selectedCard == card ? null : card;
    try {
      await roomService.submitVote(newCard);
      setSelectedCard(newCard);
    } catch (err) {
      toaster.error("Failed to submit vote", {});
    }
  }

  useEffect(() => {
    updateJoinInfo(joinInfo);

    const socket = io({
      extraHeaders: {
        roomName: roomName,
        "x-token": authToken,
      },
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error", err);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected", reason);
    });

    socket.on("error", (err) => {
      console.error("Socket error", err);
    });

    socket.on("roomUpdate", (room: RoomUpdate) => {
      console.log("Received room update", room);
      setRevealed(room.revealed);
      setAllowedCards(room.allowedCards);
      setPlayers(room.players);
      if (room.reset) {
        setSelectedCard(null);
      }
    });
  }, []);

  return (
    <div class="main">
      <Settings></Settings>
      <h1 class="is-size-1">no-fuzz estimates</h1>
      <UsernameInput username={username} updateUsername={updateUsername} />

      <RoomActions
        revealed={revealed}
        reveal={() => roomService.revealCards()}
        reset={() => roomService.resetCards()}
      ></RoomActions>

      <PlayerList players={players} revealed={revealed} />

      <CardSelector
        allowedCards={allowedCards}
        selectedCard={selectedCard}
        updateSelectedCard={updateSelectedCard}
      />
    </div>
  );
}

const root = document.getElementById("app")!;
render(<App />, root);
