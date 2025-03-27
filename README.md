# Jira Ticket Finder

Make releases easier by determining which Jira tickets have been completed since the last release.

This script will:

1. Search through git repositories in the current working directory (or specific repos you provide)
1. Find the latest git tag in each repository
1. Extract Jira ticket numbers from commit messages since that tag
1. Output a summary of all found ticket numbers

## Setup

Make sure you have [bun](https://bun.sh/docs/installation) installed globally. If not, you can install it with npm:

```bash
npm i -g bun
```

### Global Installation

Register this script globally under the `jira` cli command with:

```bash
bun run build

# no longer has to be in this project
cd /parent/dir/of/group/of/repos

# global nrds command is now registered!
jira
```

## Usage

```bash
# bun prefix is not necessary if global installation 👆 is done
jira [options]
```

## Options:

- `-r`, `--repos`: Specific repositories to search (defaults to all git repos in current directory)
- `-p`, `--prefixes`: Jira project prefixes to look for (e.g., "PROJ", "TEST")
- `-t`, `--tagPattern`: Pattern to match version tags (e.g., "v\*") (default to the latest tag)

## Examples:

**Search all repositories in the current directory:**

```bash
jira
```

**Search specific repositories:**

```bash
jira --repos repo1 repo2
```

**Search for specific Jira project tickets:**

```bash
jira --prefixes PROJ TEST
```

**Search with a specific tag pattern:**

```bash
jira --tag-pattern "v[0-9]*"
```

The script will provide both detailed output per repository and a summary of all unique Jira tickets found across all repositories.
