/**
 * Generates a Jira ticket URL from a ticket ID and base URL
 * @param ticketId The Jira ticket ID (e.g., ABC-123)
 * @param baseUrl The base URL of the Jira instance (e.g., https://yourdomain.atlassian.net)
 * @returns The full URL to the Jira ticket
 */
export function getJiraTicketUrl(ticketId: string, baseUrl: string): string {
  const match = baseUrl.match(/^(https?:\/\/.+\/browse)/)
  if (!match) throw new Error("Invalid Jira base URL")
  return `${match[1]}/${ticketId}`
}
