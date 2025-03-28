import commandLineArgs from "command-line-args"
import commandLineUsage, { type OptionDefinition, type Section } from "command-line-usage"

type Args = {
  repo: string[]
  excludeRepo: string[]
  prefix: string[]
  tagPattern: string | undefined
  maxTickets: number
  toCommit: string | undefined
  fetchLatest: boolean
  help?: boolean
}

export const optionDefinitions: OptionDefinition[] = [
  {
    name: "repo",
    alias: "r",
    type: String,
    multiple: true,
    defaultValue: [],
    description: "Specify repository paths or globs to search in",
  },
  {
    name: "exclude-repo",
    alias: "x",
    type: String,
    multiple: true,
    defaultValue: [],
    description: "Specify repository paths or globs to exclude",
  },
  {
    name: "prefix",
    alias: "p",
    type: String,
    multiple: true,
    defaultValue: [],
    description: "Jira ticket prefixes to search for (e.g., 'ABC', 'XYZ')",
  },
  {
    name: "tag-pattern",
    alias: "t",
    type: String,
    description: "Regex pattern to filter tags (e.g., '^v[0-9]')",
  },
  {
    name: "max-tickets",
    alias: "m",
    type: Number,
    defaultValue: 30,
    description: "Maximum number of tickets per repo before excluding (default: 30)",
  },
  {
    name: "to-commit",
    alias: "c",
    type: String,
    description: "End commit to search to (defaults to main branch)",
  },
  {
    name: "fetch-latest",
    type: Boolean,
    defaultValue: true,
    description: "Fetch latest from remote before searching (default: true)",
  },
  {
    name: "no-fetch-latest",
    alias: "n",
    type: Boolean,
    description: "Do not fetch latest from remote before searching",
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Display this usage guide",
  },
]

export function parseCommandLineArgs(): Args {
  const options = commandLineArgs(optionDefinitions, { camelCase: true })

  return {
    ...(options as any),
    fetchLatest: options.fetchLatest && !options.noFetchLatest,
  }
}

export function showUsageGuide(): void {
  const sections: Section[] = [
    {
      header: "Jira Ticket Finder",
      content:
        "Make releases easier by determining which Jira tickets have been completed since the last release.",
    },
    {
      header: "Options",
      optionList: optionDefinitions,
      hide: ["fetch-latest"],
    },
    {
      header: "Examples",
      content: [
        "Search all repositories in the current directory",
        "$ jira",
        "",
        "Search in a specific repository",
        "$ jira --repo my-repo",
        "$ jira --repo ~/projects/my-repo",
        "",
        "Use glob pattern to search multiple repositories",
        '$ jira --repo "~/projects/*"',
        "",
        "Search for specific Jira ticket prefixes",
        "$ jira --prefix PROJ --prefix TEST",
        "",
        "Search for a specific tag pattern",
        '$ jira --tag-pattern "v*"',
      ],
    },
  ]

  console.log(commandLineUsage(sections))
}
