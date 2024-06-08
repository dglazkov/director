import { readFile } from "fs/promises";
import { createServer } from "http";
import { env } from "node:process";

const PORT = env.PORT || 3000;
const HOST = env.HOST || "localhost";
const HOSTNAME = `http://${HOST}:${PORT}`;

const CONTENT_TYPE = { "Content-Type": "plain/text;charset=UTF-8" };

type ConfigItem = {
  from: string;
  to: string;
};

type ConfigReadResult =
  | {
      error: string;
    }
  | {
      map: Map<string, string>;
    };

const readConfig = async (filename: string): Promise<ConfigReadResult> => {
  try {
    const data = await readFile(filename, "utf-8");
    if (!data) {
      throw new Error("No data found");
    }
    const json = JSON.parse(data) as ConfigItem[];
    const map = new Map<string, string>();
    for (const item of json) {
      map.set(item.from, item.to);
    }
    return { map };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

const config = await readConfig("config.json");

const server = createServer((req, res) => {
  const host = req.headers.host;
  if (!host) {
    res.writeHead(400, CONTENT_TYPE);
    res.end("🪹");
    return;
  }
  if ("error" in config) {
    res.writeHead(500, CONTENT_TYPE);
    res.end(`🔥 ${config.error}`);
    return;
  }
  const target = config.map.get(host);
  if (!target) {
    res.writeHead(404, CONTENT_TYPE);
    res.end("🤷");
    return;
  }
  res.writeHead(302, { Location: target });
  res.end();
});

server.listen(PORT, () => {
  console.info(`Running on "${HOSTNAME}"...`);
});
