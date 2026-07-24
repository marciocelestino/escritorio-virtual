import { ImageResponse } from "next/og";
import { brandMarkElement } from "@/lib/brandMark";

const SIZE = 512;

export async function GET() {
  return new ImageResponse(
    brandMarkElement(SIZE),
    { width: SIZE, height: SIZE }
  );
}
