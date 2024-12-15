import { logger } from "./logger";
import { parseArgs } from "util";
import { initalizeBot } from "./bot";

export const globalConfig = {
  devMode: false,
  apiURL: `http://localhost:2000`,
  ticketServer: "",
  landingServer: "",
  currentStatus: "",
};

async function main() {
  if (values.dev) globalConfig.devMode = true;

  logger.info(
    `welcome to shmoocon '25 bot ${globalConfig.devMode ? "(dev)" : "(prod)"}`
  );

  await initalizeBot();
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    dev: {
      type: "boolean",
    },
  },
  strict: true,
  allowPositionals: true,
});

await main();
