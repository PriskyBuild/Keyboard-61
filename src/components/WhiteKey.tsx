// MIT License — Piano Learning App
// White key wrapper — passes the right variant + default sizing.

"use client";

import { memo } from "react";
import { KeyBase, type KeyProps } from "@/components/Key";

export interface WhiteKeyProps extends Omit<KeyProps, "variant"> {
  /** Render width in pixels for this white key (computed by Piano). */
  pixelWidth?: number;
  /** Render height in pixels for this white key. */
  pixelHeight?: number;
}

function WhiteKeyImpl({
  pixelWidth,
  pixelHeight,
  ...rest
}: WhiteKeyProps) {
  return (
    <KeyBase
      variant="white"
      width={pixelWidth}
      height={pixelHeight}
      {...rest}
    />
  );
}

export const WhiteKey = memo(WhiteKeyImpl);
