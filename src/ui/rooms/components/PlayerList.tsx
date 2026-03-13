import type { PlayerUpdate } from "../../../api/types";

type Props = {
  players: Record<string, PlayerUpdate>;
  revealed: boolean;
};

export default function PlayerList({ players, revealed }: Props) {
  return (
    <div class="playerlist">
      {Object.entries(players).map(([id, player]) => (
        <div class="playerlist-item is-size-4">
          <div class="playername">{player.name}</div>
          <div>{revealed ? player.card : player.voted ? "✔️" : ""}</div>
        </div>
      ))}
    </div>
  );
}
