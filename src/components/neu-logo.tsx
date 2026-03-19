import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function NeuLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"
        fill="hsl(var(--primary) / 0.1)"
        stroke="hsl(var(--primary))"
        strokeWidth="5"
      />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="32"
        fontWeight="bold"
        fill="hsl(var(--primary))"
        className="font-headline"
      >
        NEU
      </text>
    </svg>
  );
}
