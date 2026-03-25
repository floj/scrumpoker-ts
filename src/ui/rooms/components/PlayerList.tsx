import { useMemo } from "hono/jsx";
import type { PlayerUpdate } from "../../../api/types";

type Props = {
  players: Record<string, PlayerUpdate>;
  revealed: boolean;
  allowedCards: string[];
};

function sortByName(
  left: [string, PlayerUpdate],
  right: [string, PlayerUpdate],
) {
  return left[1].name.localeCompare(right[1].name);
}

function sortByCardIndexAndName(
  left: [string, PlayerUpdate],
  right: [string, PlayerUpdate],
  allowedCards: string[],
) {
  const lc = left[1].card;
  const rc = right[1].card;
  if (lc === rc) {
    return left[1].name.localeCompare(right[1].name);
  }
  if (lc === null) {
    return 1;
  }
  if (rc === null) {
    return -1;
  }
  return allowedCards.indexOf(lc) - allowedCards.indexOf(rc);
}

export default function PlayerList({ players, revealed, allowedCards }: Props) {
  const playerList = useMemo(() => {
    const pEntries = Object.entries(players);
    if (!revealed) {
      return pEntries.toSorted((l, r) => sortByName(l, r));
    }
    // sort by index of the card in allowedCards, with non-voted players at the end
    return pEntries.toSorted((l, r) =>
      sortByCardIndexAndName(l, r, allowedCards),
    );
  }, [players, revealed, allowedCards]);

  return (
    <div class="playerlist">
      {playerList.map(([_, player]) => (
        <div class="playerlist-item is-size-4">
          <div class="playername">{player.name}</div>
          <div>{revealed ? player.card : player.voted ? "✔️" : ""}</div>
        </div>
      ))}
    </div>
  );
}
