#!/usr/bin/env bun

import { exec } from "child_process"
import { promisify } from "util"
import fs from "node:fs"
import path from "node:path"
import chalk from "chalk"
import { glob } from "glob"

import { parseCommandLineArgs } from "./cli"
import { extractJiraTickets } from "./extract-jira-tickets"

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
    return null
  }
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
      const globPromises = specifiedRepos
        .map((repo) => path.resolve(cwd, repo))
        .map((path) => glob(path))
      const resolvedGlobs = await Promise.all(globPromises)
      repos = resolvedGlobs.flat()
    } else {
      const allDirs = await getDirectories(cwd)
      for (const dir of allDirs) {
        if (await isGitRepo(dir)) {
          repos.push(dir)
        }
      }
    }

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

      const latestTag = await getLatestTag(repo, tagPattern)
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

      const tickets = await extractJiraTickets(repo, latestTag, prefixes)

      if (tickets.length > maxTickets) {
        console.info(
          chalk.redBright(
            `  Excluding repository with ${tickets.length} tickets (exceeds threshold of ${maxTickets})`,
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
      }
    }

    console.info("\n\n")
    console.info(chalk.bgBlueBright("=="))
    console.info(chalk.bgBlueBright("=== Summary ==="))
    console.info(chalk.bgBlueBright("=="))
    console.info("\n")

    if (allTickets.length > 0) {
      const uniqueTickets = [...new Set(allTickets)]
      console.info(`Found ${uniqueTickets.length} unique Jira tickets across all repositories:`)

      console.info("\nRepositories and their latest tags:")
      for (const [repoName, info] of Object.entries(repoInfo)) {
        if (info.excludedReason) {
          console.info(`  ${chalk.green(repoName)}: ${chalk.redBright(info.excludedReason)}`)
        } else if (info.tickets.length > 0) {
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
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
