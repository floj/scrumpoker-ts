type Props = {
  allowedCards: string[];
  selectedCard: string | null;
  updateSelectedCard: (card: string) => void;
};

export default function CardSelector({
  allowedCards,
  selectedCard,
  updateSelectedCard,
}: Props) {
  return (
    <div class="vcard-container">
      {allowedCards.map((card) => (
        <button
          class={`button vcard ${selectedCard === card ? "vcard-selected" : ""}`}
          onClick={() => updateSelectedCard(card)}
        >
          {card}
        </button>
      ))}
    </div>
  );
}
