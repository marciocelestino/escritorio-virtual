import { ImageResponse } from "next/og";
import { brandMarkElement } from "@/lib/brandMark";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    brandMarkElement(size.width),
    { ...size }
  );
}
