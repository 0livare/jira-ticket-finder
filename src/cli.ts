import { parseArgs } from "util"

export async function parseCommandLineArgs() {
  let { values } = parseArgs({
    args: Bun.argv,
    options: {
      repo: {
        type: "string",
        short: "r",
        multiple: true,
        default: [],
      },
      prefix: {
        type: "string",
        short: "p",
        multiple: true,
        default: [],
      },
      tagPattern: {
        type: "string",
        short: "t",
        default: undefined,
      },
      maxTickets: {
        type: "string",
        short: "m",
        default: "30",
      },
      toCommit: {
        type: "string",
        short: "c",
      },
      noFetchLatest: {
        type: "boolean",
        short: "f",
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  })

  return values
}
