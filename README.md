# jira-ticket-finder

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

---

This script will:

1. Search through git repositories in the current working directory (or specific repos you provide)
1. Find the latest git tag in each repository
1. Extract Jira ticket numbers from commit messages since that tag
1. Output a summary of all found ticket numbers

## Usage

```bash
bun jira-ticket-finder.js [options]
```

## Options:

- `-r`, `--repos`: Specific repositories to search (defaults to all git repos in current directory)
- `-p`, `--prefixes`: Jira project prefixes to look for (e.g., "PROJ", "TEST")
- `-t`, `--tag-pattern`: Pattern to match version tags (e.g., "v\*") (default to the latest tag)

## Examples:

**Search all repositories in the current directory:**

```bash
bun jira-ticket-finder.js
```

**Search specific repositories:**

```bash
bun jira-ticket-finder.js --repos repo1 repo2
```

**Search for specific Jira project tickets:**

```bash
bun jira-ticket-finder.js --prefixes PROJ TEST
```

**Search with a specific tag pattern:**

```bash
bun jira-ticket-finder.js --tag-pattern "v[0-9]*"
```

The script will provide both detailed output per repository and a summary of all unique Jira tickets found across all repositories.
