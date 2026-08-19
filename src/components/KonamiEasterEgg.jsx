import { useEffect, useRef, useState } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const CONFETTI_COLORS = ["#90b495", "#65826b", "#c3bcb3", "#02362f", "#e5eae2"];
const CONFETTI_COUNT = 60;

function makeConfettiPieces() {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 1.5,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
  }));
}

export function KonamiEasterEgg() {
  const progressRef = useRef(0);
  const [pieces, setPieces] = useState(null);

  useEffect(() => {
    function handleKeyDown(event) {
      const expected = KONAMI_SEQUENCE[progressRef.current];
      if (event.key === expected) {
        progressRef.current += 1;
        if (progressRef.current === KONAMI_SEQUENCE.length) {
          progressRef.current = 0;
          setPieces(makeConfettiPieces());
          setTimeout(() => setPieces(null), 3500);
        }
      } else {
        progressRef.current = event.key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!pieces) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            position: "absolute",
            left: `${piece.left}%`,
            top: "-20px",
            width: piece.size,
            height: piece.size * 0.4,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          to {
            top: 110vh;
            transform: rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
