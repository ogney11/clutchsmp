import "server-only";

import { Rcon } from "rcon-client";
import { getRequiredEnv } from "@/lib/server/env";

export async function sendMinecraftCommand(command: string) {
  const rcon = await Rcon.connect({
    host: getRequiredEnv("RCON_HOST"),
    port: Number(process.env.RCON_PORT || 25575),
    password: getRequiredEnv("RCON_PASSWORD"),
  });

  try {
    return await rcon.send(command);
  } finally {
    await rcon.end();
  }
}
