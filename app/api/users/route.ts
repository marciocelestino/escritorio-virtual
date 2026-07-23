import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";

export async function GET() {
  const safeUsers = getAllUsers().map((full) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senhaHash, spotifyRefreshToken, ...user } =
      full;

    return {
      ...user,
      spotifyConnected: Boolean(
        spotifyRefreshToken
      ),
    };
  });

  return NextResponse.json(safeUsers);
}
