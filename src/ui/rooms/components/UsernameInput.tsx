import { useState } from "hono/jsx";

type Props = {
  username: string;
  updateUsername: (username: string) => void;
};

export default function UsernameInput({ username, updateUsername }: Props) {
  const [newName, setNewName] = useState(username);
  return (
    <div>
      <div class="field has-addons">
        <div class="control">
          <input
            class="input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              const input = e.currentTarget as HTMLInputElement;
              setNewName(input.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateUsername(newName);
              }
            }}
          />
        </div>
        <div class="control">
          <button
            class="button is-primary"
            onClick={() => updateUsername(newName)}
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
