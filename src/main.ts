#!/usr/bin/env bun

import path from "node:path"
import chalk from "chalk"

import { parseCommandLineArgs, showUsageGuide } from "./cli"
import { extractJiraTickets } from "./extract-jira-tickets"
import {
  getLatestTag,
  findRepoPaths,
  expandFileNamePathGlob,
  getMainBranch,
  execAsync,
} from "./helpers"

const args = parseCommandLineArgs()

if (args.help) {
  showUsageGuide()
  process.exit(0)
}

async function main(): Promise<void> {
  try {
    let repos = await findRepoPaths(args.repo)
    let excludeRepos = await expandFileNamePathGlob(args.excludeRepo)
    repos = repos.filter((repo) => !excludeRepos.includes(repo))

    if (repos.length === 0) {
      console.info("No git repositories found")
      return
    }

    console.info(`Searching for Jira tickets in ${repos.length} repositories...`)

    let allTickets: string[] = []
    // Track repository information including tags
    const repoInfo: Record<
      string,
      { tickets: string[]; tag: string | null; excludedReason?: string }
    > = {}

    for (const repo of repos) {
      const repoName = path.basename(repo)
      console.info(`\n${chalk.green(repoName)}`)

      if (args.fetchLatest) await execAsync("git fetch --all", { cwd: repo })

      const latestTag = await getLatestTag({ repoPath: repo, tagPattern: args.tagPattern })
      if (latestTag) {
        console.info(`  Latest tag: ${chalk.yellow(latestTag)}`)
      } else {
        console.info(chalk.redBright("  No tags found, excluding repository"))
        repoInfo[repoName] = {
          tickets: [],
          tag: null,
          excludedReason: "Excluded due to no release tags",
        }
        continue
      }

      const toCommit = args.toCommit || (await getMainBranch(repo))
      const gitRange = latestTag ? `${latestTag}..${toCommit}` : toCommit
      console.info(chalk.gray.italic(`  Searching commits: ${gitRange}`))
      const tickets = await extractJiraTickets({ repoPath: repo, gitRange, prefixes: args.prefix })

      if (tickets.length > args.maxTickets) {
        console.info(
          chalk.redBright(
            `  Excluding repository with ${tickets.length} tickets (exceeds threshold of ${args.maxTickets})`,
          ),
        )
        repoInfo[repoName] = {
          tickets: [],
          tag: null,
          excludedReason: "Excluded due to exceeding threshold",
        }
      } else if (tickets.length > 0) {
        console.info(`  Found ${tickets.length} Jira tickets:`)

        for (const ticket of tickets) {
          console.info(`    ${chalk.cyan(ticket)}`)
        }
        allTickets = [...allTickets, ...tickets]
        repoInfo[repoName] = { tickets, tag: latestTag }
      } else {
        console.info("  No Jira tickets found")
        repoInfo[repoName] = { tickets: [], tag: latestTag }
      }
    }

    console.info("\n\n")
    console.info(chalk.bgBlueBright("*************************"))
    console.info(chalk.bgBlueBright("******** Summary ********"))
    console.info(chalk.bgBlueBright("*************************"))
    console.info("")

    if (allTickets.length > 0) {
      const uniqueTickets = [...new Set(allTickets)]
      console.info(`Found ${uniqueTickets.length} unique Jira tickets across all repositories.`)

      console.info("\nRepositories and their latest tags:")
      for (const [repoName, info] of Object.entries(repoInfo)) {
        if (info.excludedReason) {
          console.info(`  ${chalk.green(repoName)}: ${chalk.redBright(info.excludedReason)}`)
        } else {
          console.info(
            `  ${chalk.green(repoName)}: ${chalk.yellow(info.tag || "No tag")} ${chalk.gray(`(${info.tickets.length} tickets)`)}`,
          )
        }
      }

      console.info("\nJira tickets:")
      for (const ticket of uniqueTickets) {
        console.info(chalk.cyan(ticket))
      }
    } else {
      console.info("No Jira tickets found in any repository")
    }

    console.info("\n\n")
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
