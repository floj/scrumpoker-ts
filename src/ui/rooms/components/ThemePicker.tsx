import { useEffect, useState } from "hono/jsx";

type Props = {};

type ThemeType = "light" | "dark" | null;
function getSavedTheme(): ThemeType {
  const t = localStorage.getItem("theme");
  switch (t) {
    case "light":
      return t;
    case "dark":
      return t;
    default:
      return null;
  }
}

export default function ThemePicker({}: Props) {
  const [theme, setTheme] = useState(getSavedTheme());

  function updateTheme(resolved: ThemeType) {
    if (resolved === null) {
      document.documentElement.removeAttribute("data-theme");
      return;
    }
    document.documentElement.setAttribute("data-theme", resolved);
    if (theme !== null) {
      localStorage.setItem("theme", resolved);
    }
  }

  useEffect(() => updateTheme(theme), [theme]);

  return (
    <div class="dropdown is-hoverable">
      <div class="dropdown-trigger">
        <button
          class="button"
          aria-haspopup="true"
          aria-controls="dropdown-menu"
        >
          <span class="capitalized">{theme ?? "System"}</span>
        </button>
      </div>
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <a
            href="#"
            class={`dropdown-item ${theme === "light" ? "is-active" : ""}`}
            onClick={() => setTheme("light")}
          >
            Light
          </a>
          <a
            class={`dropdown-item ${theme === "dark" ? "is-active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            Dark
          </a>
          <a
            href="#"
            class={`dropdown-item ${theme === null ? "is-active" : ""}`}
            onClick={() => setTheme(null)}
          >
            System
          </a>
        </div>
      </div>
    </div>
  );
}
