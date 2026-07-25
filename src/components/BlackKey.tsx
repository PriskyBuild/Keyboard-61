// MIT License — Piano Learning App
// Black key wrapper — positioned absolutely over the white-key row.

"use client";

import { memo } from "react";
import { KeyBase, type KeyProps } from "@/components/Key";

export interface BlackKeyProps extends Omit<KeyProps, "variant"> {
  /** Pixel width of this black key (computed by Piano). */
  pixelWidth?: number;
  /** Pixel height of this black key. */
  pixelHeight?: number;
  /** Pixel offset from the left edge of the keyboard. */
  pixelLeft?: number;
}

function BlackKeyImpl({
  pixelWidth,
  pixelHeight,
  pixelLeft,
  style,
  ...rest
}: BlackKeyProps) {
  return (
    <KeyBase
      variant="black"
      width={pixelWidth}
      height={pixelHeight}
      style={{
        position: "absolute",
        left: pixelLeft,
        top: 0,
        zIndex: 2,
        ...style,
      }}
      {...rest}
    />
  );
}

export const BlackKey = memo(BlackKeyImpl);
