import { faker, pl } from "@faker-js/faker";

class Room {
  name: string;
  createdAt = new Date();
  updatedAt = new Date();
  players: Map<string, Player> = new Map();
  playersAuth: Map<string, Player> = new Map();
  allowedCards: string[];
  revealed = false;

  constructor(name: string, allowedCards: string[]) {
    this.name = name;
    this.allowedCards = allowedCards;
  }

  addPlayer(player: Player) {
    this.players.set(player.id, player);
    this.playersAuth.set(player.authToken, player);
    this.updatedAt = new Date();
  }

  vote(playerId: string, card: string | null) {
    const player = this.players.get(playerId);
    if (player === undefined) {
      return;
    }
    player.card = card;
    player.updatedAt = new Date();
    this.updatedAt = new Date();
  }

  reset() {
    this.revealed = false;
    for (const player of this.players.values()) {
      player.card = null;
    }
    this.updatedAt = new Date();
  }

  reveal() {
    this.revealed = true;
    this.updatedAt = new Date();
  }

  playerByAuthToken(authToken?: string) {
    if (authToken === undefined) {
      return undefined;
    }
    return this.playersAuth.get(authToken);
  }

  asResponse(reset?: boolean) {
    return {
      name: this.name,
      allowedCards: this.allowedCards,
      revealed: this.revealed,
      reset,
      players: Object.fromEntries(
        this.players.entries().map(([id, p]) => [
          id,
          {
            id: p.id,
            name: p.name,
            card: this.revealed ? p.card : null,
            voted: p.card !== null,
          },
        ]),
      ),
    };
  }

  cleanup() {
    const inactiveThreshold = 1000 * 60 * 5; // 5 minutes
    const now = Date.now();
    const pp = Array.from(this.players.values());
    for (const player of pp) {
      if (now - player.updatedAt.getTime() > inactiveThreshold) {
        console.log("Removing inactive player", {
          roomName: this.name,
          playerId: player.id,
          playerName: player.name,
        });
        this.players.delete(player.id);
        this.playersAuth.delete(player.authToken);
      }
    }
    return this.players.size === 0;
  }
}

type RoomUpdate = ReturnType<Room["asResponse"]>;
type PlayerUpdate = RoomUpdate["players"][string];

class Player {
  id: string;
  name: string;
  authToken: string;
  card: string | null = null;
  updatedAt = new Date();

  constructor(name?: string) {
    this.name = name ?? faker.person.jobTitle();
    this.id = crypto.randomUUID();
    this.authToken = crypto.randomUUID();
  }
}

type CreateRoomResponse = {
  name: Room["name"];
};

type JoinRoomRequest = {
  username?: Player["name"];
  authToken?: Player["authToken"];
};

type JoinRoomResponse = {
  playerId: Player["id"];
  authToken: Player["authToken"];
  username: Player["name"];
  selectedCard: Player["card"];
  room: RoomUpdate;
};

type VoteRequest = {
  card: Player["card"];
};

export type {
  JoinRoomRequest,
  JoinRoomResponse,
  VoteRequest,
  CreateRoomResponse,
  RoomUpdate,
  PlayerUpdate,
};
export { Room, Player };
