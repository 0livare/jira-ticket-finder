import commandLineArgs from "command-line-args"

type Args = {
  repo: string[]
  prefix: string[]
  tagPattern: string | undefined
  maxTickets: number
  toCommit: string | undefined
  fetchLatest: boolean
}

export function parseCommandLineArgs(): Args {
  const options = commandLineArgs(
    [
      { name: "repo", alias: "r", type: String, multiple: true, defaultValue: [] },
      { name: "prefix", alias: "p", type: String, multiple: true, defaultValue: [] },
      { name: "tag-pattern", alias: "t", type: String },
      { name: "max-tickets", alias: "m", type: Number, defaultValue: 30 },
      { name: "to-commit", alias: "c", type: String },
      { name: "fetch-latest", type: Boolean, defaultValue: true },
      { name: "no-fetch-latest", alias: "n", type: Boolean },
    ],
    { camelCase: true },
  )

  return {
    ...(options as any),
    fetchLatest: options.fetchLatest && !options.noFetchLatest,
  }
}
