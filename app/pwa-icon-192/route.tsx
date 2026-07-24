import { ImageResponse } from "next/og";
import { brandMarkElement } from "@/lib/brandMark";

const SIZE = 192;

export async function GET() {
  return new ImageResponse(
    brandMarkElement(SIZE),
    { width: SIZE, height: SIZE }
  );
}
