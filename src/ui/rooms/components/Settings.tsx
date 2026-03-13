import CopyLink from "./CopyLink";
import ThemePicker from "./ThemePicker";

type Props = {};

export default function Settings({}: Props) {
  return (
    <div class="settings">
      <div><CopyLink /></div>
      <div><ThemePicker /></div>
    </div>
  );
}
