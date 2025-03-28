# Jira Ticket Finder

Make releases easier by determining which Jira tickets have been completed since the last release.

This script will:

1. Search through git repositories in the current working directory (or specific repos you provide)
1. Find the latest git tag in each repository
1. Extract Jira ticket numbers from commit messages since that tag
1. Output a summary of all found ticket numbers

### Installation

Make sure you have [bun](https://bun.sh/docs/installation) installed globally. If not, you can install it with npm:

```bash
npm i -g bun
```

Then clone this repo

```bash
git clone https://github.com/0livare/jira-ticket-finder.git
cd jira-ticket-finder
```

Then register this script globally under the `jira` cli command with:

```bash
bun run build

# global jira command is now registered!
jira
```

## Usage

```bash
cd /parent/dir/of/group/of/repos

jira [options]
```

## Options:

- `-r`, `--repo`: Specific repositories to search (defaults to all git repos in current directory). Can be repo names or paths or globs.
- `-x`, `--exclude-repo`: Specific repositories to exclude. Can be repo names or paths or globs.
- `-p`, `--prefix`: Jira project prefixes to look for (e.g., "PROJ", "TEST")
- `-t`, `--tag-pattern`: Glob pattern to match version tags (e.g., `v*`) (default to the latest tag)
- `-m`, `--max-tickets`: Maximum number of tickets to process per repository (default: 30)
- `-c`, `--to-commit`: Commitish to stop searching at (default: main/master)
- `-n`, `--no-fetch-latest`: Skip fetching latest repo data before searching
- `-h`, `--help`: Display usage guide

## Examples:

**Search all repositories in the current directory:**

```bash
jira
```

**Search specific repositories:**

Names of repos in the current directory, or paths to repos, can be provided. Glob patterns can be used to match multiple repositories.

```bash
jira --repo repo1 repo2
jira --repo ~/dev/repo1 --repo ../repo2
jira -r "files*"
```

**Search for specific Jira ticket prefixes:**

```bash
jira --prefix PROJ TEST
jira --prefix PROJ --prefix TEST
```

**Search for a specific tag pattern:**

Specify a glob pattern to use for matching version tags. Default is to use the latest tag.

```bash
jira --tag-pattern "v*"
jira --tag-pattern "*.*.*"
jira -t "v[0-9]*"
```

**Set a different threshold for maximum tickets per repository:**

```bash
jira --max-tickets 50
```

The script will provide both detailed output per repository and a summary of all unique Jira tickets found across all repositories. Repositories with more tickets than the specified maximum will be excluded from the summary.
