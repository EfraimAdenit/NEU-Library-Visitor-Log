import { cn } from "@/lib/utils";
import Image from "next/image";
import type { HTMLAttributes } from "react";

export default function NeuLogo(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("relative", props.className)}>
      <Image
        src="https://upload.wikimedia.org/wikipedia/en/c/c4/New_Era_University_logo.png"
        alt="New Era University Logo"
        fill
        sizes="10vw"
        className="object-contain"
      />
    </div>
  );
}
