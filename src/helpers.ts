import { exec } from "child_process"
import { promisify } from "util"
import fs from "node:fs"
import path from "node:path"
import { glob } from "glob"

export const execAsync = promisify(exec)

/** Get the latest git tag in a repository */
export async function getLatestTag(args: {
  repoPath: string
  tagPattern?: string
}): Promise<string | null> {
  const { repoPath, tagPattern } = args
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

export async function findRepoPaths(repoPathNameGlobs: string[]): Promise<string[]> {
  const cwd = process.cwd()

  if (repoPathNameGlobs.length > 0) {
    return expandFileNamePathGlob(repoPathNameGlobs)
  }

  // If no repositories are specified, search for all git
  // repositories in the current working directory
  const allDirs = await getDirectories(cwd)
  allDirs.push(cwd)
  const repos = []
  for (const dir of allDirs) {
    if (await isGitRepo(dir)) repos.push(dir)
  }
  return repos
}

/**
 * If passed a full file/directory path, return it.
 * If passed a directory name without a path, assume it is in the current working directory.
 * If passed a glob pattern, expand it into a list of file/directory paths.
 */
export async function expandFileNamePathGlob(dirNamePathGlobs: string[]): Promise<string[]> {
  const cwd = process.cwd()
  if (dirNamePathGlobs.length === 0) return []

  const globPromises = dirNamePathGlobs
    .map((repo) => path.resolve(cwd, repo))
    .map((path) => glob(path))
  const resolvedGlobs = await Promise.all(globPromises)
  return resolvedGlobs.flat()
}

/** Get all directories in the current working directory */
async function getDirectories(sourceDir: string): Promise<string[]> {
  const items = await fs.promises.readdir(sourceDir, { withFileTypes: true })
  return items.filter((item) => item.isDirectory()).map((item) => path.join(sourceDir, item.name))
}

async function isGitRepo(dir: string): Promise<boolean> {
  try {
    const gitDir = path.join(dir, ".git")
    const stats = await fs.promises.stat(gitDir)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

export async function getMainBranch(repoPath: string): Promise<string> {
  const { stdout: firstRemote } = await execAsync("git remote show | head -n 1", { cwd: repoPath })
  const { stdout: branches } = await execAsync("git branch", { cwd: repoPath })
  if (branches.includes("main")) return `${firstRemote.trim()}/main`
  if (branches.includes("master")) return `${firstRemote.trim()}/master`
  return "HEAD"
}
