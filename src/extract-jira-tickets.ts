import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Function to extract Jira ticket numbers from commit messages
export async function extractJiraTickets(args: {
  repoPath: string
  latestTag: string | null
  prefixes?: string[]
}): Promise<string[]> {
  const { repoPath, latestTag, prefixes } = args

  let range = latestTag ? `${latestTag}..HEAD` : "HEAD"
  const { stdout } = await execAsync(`git log ${range} --pretty=format:"%s"`, { cwd: repoPath })

  if (!stdout.trim()) {
    return []
  }

  const commitMessages = stdout.split("\n")
  let tickets: string[] = []

  // Default Jira ticket regex if no prefixes specified
  let jiraRegex: RegExp
  if (prefixes && prefixes.length > 0) {
    const prefixPattern = prefixes.join("|")
    jiraRegex = new RegExp(`(${prefixPattern})-\\d+`, "gi")
  } else {
    jiraRegex = /([A-Z]+-\d+)/g
  }

  for (const message of commitMessages) {
    const matches = message.match(jiraRegex)
    if (matches) {
      tickets = [...tickets, ...matches]
    }
  }

  // Remove duplicates and convert to uppercase for consistency
  return [...new Set(tickets.map((ticket) => ticket.toUpperCase()))]
}
