import type { CSSProperties } from "react";

type LoaderProps = {
  className?: string;
  label?: string;
};

const LETTERS = [
  { id: "letter-l", value: "L" },
  { id: "letter-o", value: "O" },
  { id: "letter-a", value: "A" },
  { id: "letter-d", value: "D" },
  { id: "letter-i", value: "I" },
  { id: "letter-n", value: "N" },
  { id: "letter-g", value: "G" },
];
const FACES = ["front", "back", "right", "left", "top", "bottom"];

export function Component({
  className = "",
  label = "Carregando",
}: LoaderProps) {
  return (
    <output aria-label={label} className={`wrapper-grid ${className}`.trim()}>
      {LETTERS.map((letter, index) => (
        <div
          className="cube"
          key={letter.id}
          style={{ "--cube-index": index } as CSSProperties}
        >
          {FACES.map((face) => (
            <div className={`face face-${face}`} key={face}>
              {face === "front" ? letter.value : null}
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </output>
  );
}

export const Loader = Component;
