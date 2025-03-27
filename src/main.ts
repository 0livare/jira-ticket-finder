#!/usr/bin/env bun

import { exec } from "child_process"
import { promisify } from "util"
import fs from "node:fs"
import path from "node:path"
import chalk from "chalk"

import { parseCommandLineArgs } from "./cli"

const execAsync = promisify(exec)

const args = await parseCommandLineArgs()

// Function to check if a directory is a git repository
async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await execAsync("git rev-parse --is-inside-work-tree", { cwd: dir })
    return true
  } catch (error) {
    return false
  }
}

// Function to get all directories in the current working directory
async function getDirectories(sourceDir: string): Promise<string[]> {
  const items = await fs.promises.readdir(sourceDir, { withFileTypes: true })
  return items.filter((item) => item.isDirectory()).map((item) => path.join(sourceDir, item.name))
}

// Function to get the latest git tag in a repository
async function getLatestTag(repoPath: string, tagPattern?: string): Promise<string | null> {
  try {
    let command = "git describe --tags --abbrev=0"
    if (tagPattern) {
      command += ` --match "${tagPattern}"`
    }
    const { stdout } = await execAsync(command, { cwd: repoPath })
    return stdout.trim()
  } catch (error) {
    console.warn(`No tags found in ${repoPath}`)
    return null
  }
}

// Function to extract Jira ticket numbers from commit messages
async function extractJiraTickets(
  repoPath: string,
  latestTag: string | null,
  prefixes?: string[],
): Promise<string[]> {
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

async function main(): Promise<void> {
  try {
    const cwd = process.cwd()
    const specifiedRepos = args.repo
    const prefixes = args.prefix
    const tagPattern = args.tagPattern
    const maxTickets = parseInt(args.maxTickets)

    // Determine which repositories to search
    let repos: string[] = []
    if (specifiedRepos.length > 0) {
      repos = specifiedRepos.map((repo) => path.resolve(cwd, repo))
    } else {
      const allDirs = await getDirectories(cwd)
      for (const dir of allDirs) {
        if (await isGitRepo(dir)) {
          repos.push(dir)
        }
      }
    }

    if (repos.length === 0) {
      console.log("No git repositories found")
      return
    }

    console.log(`Searching for Jira tickets in ${repos.length} repositories...`)

    let allTickets: string[] = []
    // Track repository information including tags
    const repoInfo: Record<string, { tickets: string[]; tag: string | null }> = {}

    for (const repo of repos) {
      const repoName = path.basename(repo)
      console.log(`\nRepository: ${chalk.green(repoName)}`)

      const latestTag = await getLatestTag(repo, tagPattern)
      if (latestTag) {
        console.log(`Latest tag: ${chalk.yellow(latestTag)}`)
      } else {
        console.log("No tags found, searching all commits")
      }

      const tickets = await extractJiraTickets(repo, latestTag, prefixes)

      if (tickets.length > maxTickets) {
        console.log(
          chalk.redBright(
            `Excluding repository with ${tickets.length} tickets (exceeds threshold of ${maxTickets})`,
          ),
        )
      } else if (tickets.length > 0) {
        console.log(`Found ${tickets.length} Jira tickets:`)

        for (const ticket of tickets) {
          console.log(`  ${chalk.cyan(ticket)}`)
        }
        allTickets = [...allTickets, ...tickets]

        repoInfo[repoName] = { tickets: tickets, tag: latestTag }
      } else {
        console.log("No Jira tickets found")
      }
    }

    console.log(chalk.bgBlueBright("\n\n=== Summary ===\n\n"))
    if (allTickets.length > 0) {
      const uniqueTickets = [...new Set(allTickets)]
      console.log(`Found ${uniqueTickets.length} unique Jira tickets across all repositories:`)

      console.log("\nRepositories and their latest tags:")
      for (const [repoName, info] of Object.entries(repoInfo)) {
        if (info.tickets.length > 0) {
          console.log(
            `${chalk.green(repoName)}: ${chalk.yellow(info.tag || "No tag")} ${chalk.gray(`(${info.tickets.length} tickets)`)}`,
          )
        }
      }

      console.log("\nJira tickets:")
      for (const ticket of uniqueTickets) {
        console.log(chalk.cyan(ticket))
      }
    } else {
      console.log("No Jira tickets found in any repository")
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
