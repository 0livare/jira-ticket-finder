import path from "node:path"
import { exec } from "child_process"
import { promisify } from "util"
import { glob } from "glob"
import { isGitRepo } from "./git-helpers"

export const execAsync = promisify(exec)

export async function findRepoPaths(repoPathNameGlobs: string[]): Promise<string[]> {
  const filePaths = await expandFileNamePathGlob(repoPathNameGlobs)
  const pathIsRepoTuples = await Promise.all(
    filePaths.map(async (path) => [path, await isGitRepo(path)] as const),
  )
  const validRepoPaths = pathIsRepoTuples.filter(([_, isRepo]) => isRepo).map(([path]) => path)
  return validRepoPaths
}

/**
 * If passed a full file/directory path, return it.
 * If passed a directory name without a path, assume it is in the current working directory.
 * If passed a glob pattern, expand it into a list of file/directory paths.
 */
async function expandFileNamePathGlob(dirNamePathGlobs: string[]): Promise<string[]> {
  const cwd = process.cwd()
  if (dirNamePathGlobs.length === 0) return []

  const globPromises = dirNamePathGlobs
    .map((repo) => path.resolve(cwd, repo))
    .map((path) => glob(path))
  const resolvedGlobs = await Promise.all(globPromises)
  return resolvedGlobs.flat()
}
