import type {
  RoomUpdate,
  CreateRoomResponse,
  JoinRoomResponse,
  VoteRequest,
  JoinRoomRequest,
} from "../../api/types";

function buildUrl(
  parts: string[],
  queryParams?: Record<string, string>,
): string {
  const path = parts.map(encodeURIComponent).join("/");
  if (!queryParams) {
    return path;
  }
  const query = new URLSearchParams(queryParams).toString();
  return `${path}?${query}`;
}

const defaultErrHandler = async (
  err: unknown,
  url: string,
  options: RequestInit,
) => {
  console.error(
    "Error dispatching request:",
    err,
    "URL:",
    url,
    "Options:",
    options,
  );
  throw err;
};

const defaultStatusHandler = async (
  status: number,
  url: string,
  options: RequestInit,
) => {
  throw new Error(`Request failed with status ${status}`);
};

function withAuthToken(token: string) {
  return (options: RequestInit) => {
    options.headers = Object.assign(options.headers ?? {}, {
      "X-Token": token,
    });
  };
}

class RoomService {
  private baseUrl: string;
  private roomName: string;
  private authTokenProvider: () => string;

  errHandler: (err: any, url: string, options: RequestInit) => Promise<any> =
    defaultErrHandler;
  statusHandler: (
    status: number,
    url: string,
    options: RequestInit,
  ) => Promise<any> = defaultStatusHandler;

  constructor(
    baseUrl: string,
    roomName: string,
    authTokenProvider: () => string,
  ) {
    this.baseUrl = baseUrl;
    this.roomName = roomName;
    this.authTokenProvider = authTokenProvider;
  }

  async createNewRoom(): Promise<CreateRoomResponse> {
    const resp = await this.dispatchRequest(buildUrl(["rooms"]), "POST");
    return (await resp.json()) as CreateRoomResponse;
  }

  async joinRoom(
    username: string,
    create?: boolean,
  ): Promise<JoinRoomResponse> {
    const resp = await this.dispatchRequest(
      buildUrl(["rooms", this.roomName, "join"], {
        create: create ? "true" : "false",
      }),
      "POST",
      {
        username,
        authToken: this.authTokenProvider(),
      } as JoinRoomRequest,
    );
    return (await resp.json()) as JoinRoomResponse;
  }

  async revealCards(): Promise<void> {
    await this.dispatchRequest(
      buildUrl(["rooms", this.roomName, "reveal"]),
      "POST",
      undefined,
      withAuthToken(this.authTokenProvider()),
    );
  }

  async resetCards(): Promise<void> {
    await this.dispatchRequest(
      buildUrl(["rooms", this.roomName, "reset"]),
      "POST",
      undefined,
      withAuthToken(this.authTokenProvider()),
    );
  }

  async submitVote(card: string | null): Promise<void> {
    await this.dispatchRequest(
      buildUrl(["rooms", this.roomName, "vote"]),
      "POST",
      { card } as VoteRequest,
      withAuthToken(this.authTokenProvider()),
    );
  }

  async getRoom(): Promise<RoomUpdate> {
    const resp = await this.dispatchRequest(
      buildUrl(["rooms", this.roomName]),
      "GET",
    );
    return (await resp.json()) as RoomUpdate;
  }

  private async dispatchRequest(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: Record<string, unknown>,
    ...modifiers: ((r: RequestInit) => void)[]
  ): Promise<Response> {
    const options: RequestInit = {
      method,
      headers: {},
      signal: AbortSignal.timeout(10000), // 10 seconds timeout for all requests
    };

    if (body) {
      options.headers = {
        "Content-Type": "application/json",
      };
      options.body = JSON.stringify(body);
    }

    modifiers.forEach((modifier) => modifier(options));

    try {
      const resp = await fetch(`${this.baseUrl}/${url}`, options);
      if (!resp.ok) {
        return await this.statusHandler(resp.status, url, options);
      }
      return resp;
    } catch (error) {
      return await this.errHandler(error, url, options);
    }
  }
}
export { RoomService };
