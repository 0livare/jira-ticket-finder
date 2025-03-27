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
    },
    strict: true,
    allowPositionals: true,
  })

  return values
}
