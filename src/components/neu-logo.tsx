import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export default function NeuLogo(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("relative", props.className)}>
        <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
            d="M50 10L90 30V70L50 90L10 70V30L50 10Z"
            stroke="currentColor"
            strokeWidth="8"
            />
            <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="30"
            fill="currentColor"
            className="font-headline"
            >
            NEU
            </text>
        </svg>
    </div>
  );
}
