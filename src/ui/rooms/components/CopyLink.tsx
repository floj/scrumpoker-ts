import { toaster } from "../toaster";

type Props = {};

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toaster.success("Link copied", {});
  } catch (err) {
    toaster.error(`Failed to copy link: ${err}`, {});
  }
}

export default function CopyLink({}: Props) {
  return (
    <>
      <button
        class="button"
        onClick={() => copyToClipboard(window.location.href)}
      >
        Copy room link
      </button>
    </>
  );
}
