import { exec } from "child_process"
import { promisify } from "util"
import fs from "node:fs"
import path from "node:path"
import { minimatch } from "minimatch"
import { stderr } from "node:process"

export const execAsync = promisify(exec)

/** Get the latest git tag in a repository by creation time */
export async function getLatestTag(args: {
  repoPath: string
  tagPattern?: string
}): Promise<string | null> {
  const { repoPath, tagPattern } = args
  try {
    const command = "git for-each-ref --sort=-creatordate --format '%(refname:short)' refs/tags/"
    const { stdout } = await execAsync(command, { cwd: repoPath })
    const tags = stdout.trim().split("\n")

    if (!tagPattern) return tags[0]

    const matchedTag = tags.find((tag) => minimatch(tag, tagPattern))
    return matchedTag || null
  } catch (error) {
    return null
  }
}

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    const gitDir = path.join(dir, ".git")
    const stats = await fs.promises.stat(gitDir)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

export async function getMainBranch(repoPath: string): Promise<string> {
  const { stdout: remotes } = await execAsync("git remote show", { cwd: repoPath })
  const remotesList = remotes.split("\n").map((line) => line.trim())

  // look for remotes in the order or priority: [up, upstream, origin, any other]
  const priority = ["up", "upstream", "origin"]
  remotesList.sort((a, b) => {
    const aIndex = priority.findIndex((prefix) => a.startsWith(prefix))
    const bIndex = priority.findIndex((prefix) => b.startsWith(prefix))
    if (aIndex === -1 && bIndex === -1) return 0 // both are not in priority
    if (aIndex === -1) return 1 // a is not in priority, b is
    if (bIndex === -1) return -1 // b is not in priority, a is
    if (aIndex < bIndex) return -1 // a has higher priority
    if (aIndex > bIndex) return 1 // b has higher priority
    // if both have the same priority, sort by name
    if (a < b) return -1
    if (a > b) return 1
    // if both are equal, return 0
    return 0
  })
  const firstRemote = remotesList[0]

  const { stdout: branches } = await execAsync("git branch", { cwd: repoPath })
  if (branches.includes("main")) return `${firstRemote.trim()}/main`
  if (branches.includes("master")) return `${firstRemote.trim()}/master`
  return "HEAD"
}

export async function getCommitMessagesInRange(args: { repoPath: string; gitRange: string }) {
  const { repoPath, gitRange } = args

  const { stdout } = await execAsync(`git log ${gitRange} --pretty=format:"%s"`, { cwd: repoPath })
  if (!stdout.trim()) return []

  return stdout.split("\n")
}

/**
 * Determines if one commit is a parent of another commit
 * @param args.repoPath - Path to the git repository
 * @param args.possibleParent - The hash or reference of the possible parent commit
 * @param args.possibleChild - The hash or reference of the possible child commit
 * @returns True if possibleParent is an ancestor of possibleChild, false otherwise
 */
export async function isCommitParentOf(args: {
  repoPath: string
  possibleParent: string
  possibleChild: string
}): Promise<boolean> {
  const { repoPath, possibleParent, possibleChild } = args

  try {
    // Use merge-base --is-ancestor to check if one commit is an ancestor of another
    await execAsync(`git merge-base --is-ancestor ${possibleParent} ${possibleChild}`, {
      cwd: repoPath,
    })
    return true
  } catch (error) {
    // If the command exits with non-zero status, the commit is not an ancestor
    return false
  }
}
