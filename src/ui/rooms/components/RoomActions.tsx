type Props = {
  revealed: boolean;
  reveal: () => void;
  reset: () => void;
};

export default function RoomActions({ revealed, reveal, reset }: Props) {
  if (revealed) {
    return (
      <>
        <button class="button is-danger" onClick={reset}>
          Reset
        </button>
      </>
    );
  }
  return (
    <>
      <button class="button is-primary" onClick={reveal}>
        Reveal
      </button>
    </>
  );
}
