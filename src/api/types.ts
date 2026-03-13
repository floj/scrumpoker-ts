import { faker, pl } from "@faker-js/faker";

class Room {
  name: string;
  createdAt = new Date();
  updatedAt = new Date();
  players: Map<string, Player> = new Map();
  allowedCards: string[];
  revealed = false;

  constructor(name: string, allowedCards: string[]) {
    this.name = name;
    this.allowedCards = allowedCards;
  }

  addPlayer(player: Player) {
    this.players.set(player.id, player);
    this.updatedAt = new Date();
  }

  vote(playerId: string, card: string) {
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
      player.card = "";
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
    return this.players.values().find((p) => p.authToken === authToken);
  }

  asResponse() {
    return {
      name: this.name,
      allowedCards: this.allowedCards,
      revealed: this.revealed,
      players: Object.fromEntries(
        this.players.entries().map(([id, p]) => [
          id,
          {
            id: p.id,
            name: p.name,
            card: this.revealed ? p.card : null,
            voted: p.card !== "",
          },
        ]),
      ),
    };
  }
}

type RoomResponse = ReturnType<Room["asResponse"]>;

class Player {
  id: string;
  name: string;
  authToken: string;
  card = "";
  updatedAt = new Date();

  constructor(name?: string) {
    this.name = name ?? faker.person.jobTitle();
    this.id = crypto.randomUUID();
    this.authToken = crypto.randomUUID();
  }
}

type CreateRoomResponse = {
  name : string
}

type JoinRoomRequest = {
  username?: string;
  authToken?: string;
};

type JoinRoomResponse = {
  playerId: string;
  authToken: string;
  username: string;
  selectedCard: string;
  room: RoomResponse;
};

type VoteRequest = {
  card: string;
};

export type { JoinRoomRequest, JoinRoomResponse, VoteRequest, CreateRoomResponse };
export { Room, Player };
