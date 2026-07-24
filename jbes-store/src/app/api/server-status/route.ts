import { resolveSrv } from "node:dns/promises";
import net from "node:net";
import { NextResponse } from "next/server";
import { serverIp } from "@/lib/store-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultMinecraftPort = Number(process.env.MINECRAFT_STATUS_PORT || 25682);

type MinecraftStatus = {
  players?: {
    online?: number;
    max?: number;
  };
  version?: {
    name?: string;
  };
};

export async function GET() {
  try {
    const target = await resolveMinecraftTarget(serverIp);
    const status = await pingJavaServer(target.host, target.port);

    return NextResponse.json({
      host: serverIp,
      resolvedHost: target.host,
      port: target.port,
      statusAvailable: true,
      online: true,
      playersOnline: status.players?.online ?? 0,
      playersMax: status.players?.max ?? null,
      version: status.version?.name ?? null,
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      host: serverIp,
      statusAvailable: true,
      online: false,
      playersOnline: 0,
      playersMax: null,
      error: error instanceof Error ? error.message : "Unable to read Minecraft server status.",
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  }
}

async function resolveMinecraftTarget(host: string) {
  try {
    const records = await resolveSrv(`_minecraft._tcp.${host}`);
    const [record] = records.sort((a, b) => a.priority - b.priority || b.weight - a.weight);

    if (record) {
      return {
        host: record.name,
        port: record.port,
      };
    }
  } catch {
    // No SRV record is fine; fall back to the configured status port.
  }

  return {
    host,
    port: defaultMinecraftPort,
  };
}

function pingJavaServer(host: string, port: number) {
  return new Promise<MinecraftStatus>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const chunks: Buffer[] = [];
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(error);
    };

    socket.setTimeout(5000, () => fail(new Error("Minecraft status request timed out.")));

    socket.on("connect", () => {
      socket.write(createHandshake(host, port));
      socket.write(Buffer.from([0x01, 0x00]));
    });

    socket.on("data", (chunk) => {
      chunks.push(chunk);

      try {
        const status = parseStatusResponse(Buffer.concat(chunks));
        if (!settled && status) {
          settled = true;
          socket.end();
          resolve(status);
        }
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Invalid Minecraft status response."));
      }
    });

    socket.on("error", fail);
    socket.on("end", () => {
      if (!settled) fail(new Error("Minecraft server closed the status connection."));
    });
  });
}

function createHandshake(host: string, port: number) {
  const packetData = Buffer.concat([
    writeVarInt(0),
    writeVarInt(767),
    writeString(host),
    writeUnsignedShort(port),
    writeVarInt(1),
  ]);

  return Buffer.concat([writeVarInt(packetData.length), packetData]);
}

function parseStatusResponse(buffer: Buffer) {
  let offset = 0;
  const packetLength = readVarInt(buffer, offset);
  offset = packetLength.offset;

  if (buffer.length < offset + packetLength.value) return null;

  const packetId = readVarInt(buffer, offset);
  offset = packetId.offset;

  if (packetId.value !== 0) {
    throw new Error("Unexpected Minecraft status packet.");
  }

  const jsonLength = readVarInt(buffer, offset);
  offset = jsonLength.offset;

  const json = buffer.subarray(offset, offset + jsonLength.value).toString("utf8");
  return JSON.parse(json) as MinecraftStatus;
}

function writeString(value: string) {
  const body = Buffer.from(value, "utf8");
  return Buffer.concat([writeVarInt(body.length), body]);
}

function writeUnsignedShort(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value);
  return buffer;
}

function writeVarInt(value: number) {
  const bytes = [];
  let next = value;

  do {
    let byte = next & 0x7f;
    next >>>= 7;
    if (next !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (next !== 0);

  return Buffer.from(bytes);
}

function readVarInt(buffer: Buffer, startOffset: number) {
  let value = 0;
  let position = 0;
  let offset = startOffset;
  let currentByte = 0;

  do {
    if (offset >= buffer.length) {
      throw new Error("Incomplete Minecraft status response.");
    }

    currentByte = buffer[offset];
    value |= (currentByte & 0x7f) << (7 * position);
    position += 1;
    offset += 1;

    if (position > 5) {
      throw new Error("Minecraft status response is too large.");
    }
  } while ((currentByte & 0x80) === 0x80);

  return { value, offset };
}
