import { exec } from "child_process"
import { promisify } from "util"
import fs from "node:fs"
import path from "node:path"
import { glob } from "glob"

const execAsync = promisify(exec)

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
    const globPromises = repoPathNameGlobs
      .map((repo) => path.resolve(cwd, repo))
      .map((path) => glob(path))
    const resolvedGlobs = await Promise.all(globPromises)
    return resolvedGlobs.flat()
  }

  // If no repositories are specified, search for all git
  // repositories in the current working directory
  const allDirs = await getDirectories(cwd)
  const repos = []
  for (const dir of allDirs) {
    if (await isGitRepo(dir)) repos.push(dir)
  }
  return repos
}

/** Get all directories in the current working directory */
async function getDirectories(sourceDir: string): Promise<string[]> {
  const items = await fs.promises.readdir(sourceDir, { withFileTypes: true })
  return items.filter((item) => item.isDirectory()).map((item) => path.join(sourceDir, item.name))
}

async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await execAsync("git rev-parse --is-inside-work-tree", { cwd: dir })
    return true
  } catch (error) {
    return false
  }
}
