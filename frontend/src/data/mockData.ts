export const repoData = {
  name: "acme/platform-core",
  description: "Core platform services and shared infrastructure for Acme products",
  stars: 2847,
  forks: 423,
  watchers: 156,
  healthScore: 87,
  lastUpdated: "2 hours ago",
};

export const healthMetrics = {
  ciStatus: "passing" as const,
  openPRs: 12,
  openIssues: 34,
  commits30Days: 156,
  activeContributors: 23,
  prMergeRate: 94,
  deploymentFailures: 2,
};

export const healthDetails = {
  prReviewLatency: { value: "4.2 hours", status: "good" as const },
  issueResolutionTime: { value: "3.2 days", status: "warning" as const },
  ciStability: { value: "98.5%", status: "excellent" as const },
  releaseCadence: { value: "Weekly", status: "good" as const },
};

export const needsAttention = [
  { id: 1, title: "PR #342 has been open for 14 days without review", type: "pr" as const },
  { id: 2, title: "Issue #128 marked high-impact has no assignee", type: "issue" as const },
  { id: 3, title: "CI pipeline failed 3 times in the last 24 hours", type: "ci" as const },
  { id: 4, title: "5 dependencies have security vulnerabilities", type: "security" as const },
];

export const pullRequests = [
  { id: 342, title: "feat: Add new authentication flow", author: "sarah-dev", status: "needs-review" as const, labels: ["feature", "auth"], createdAt: "14 days ago" },
  { id: 339, title: "fix: Memory leak in websocket handler", author: "mike-eng", status: "blocked" as const, labels: ["bug", "critical"], createdAt: "7 days ago" },
  { id: 337, title: "chore: Update dependencies", author: "dependabot", status: "ready" as const, labels: ["dependencies"], createdAt: "2 days ago" },
  { id: 335, title: "feat: Implement rate limiting", author: "alex-backend", status: "needs-review" as const, labels: ["feature", "api"], createdAt: "5 days ago" },
  { id: 333, title: "docs: Update API documentation", author: "emma-docs", status: "ready" as const, labels: ["documentation"], createdAt: "1 day ago" },
];

export const issues = [
  { id: 128, title: "Performance degradation in production", labels: ["high-impact", "performance"], comments: 23, createdAt: "21 days ago" },
  { id: 95, title: "Support for custom themes", labels: ["oldest", "enhancement"], comments: 45, createdAt: "67 days ago" },
  { id: 156, title: "API rate limits too restrictive", labels: ["frequently-commented", "api"], comments: 34, createdAt: "12 days ago" },
  { id: 167, title: "Mobile responsive issues on dashboard", labels: ["bug", "ui"], comments: 8, createdAt: "5 days ago" },
];

export const focusSuggestions = [
  { id: 1, insight: "PR #342 is blocking 3 other features. Consider prioritizing its review.", priority: "high" as const },
  { id: 2, insight: "Issue #128 has significant community interest. Addressing it could boost contributor satisfaction.", priority: "medium" as const },
  { id: 3, insight: "The auth module has the most technical debt. Schedule a refactoring sprint.", priority: "low" as const },
];

export const contributors = [
  { id: 1, name: "Sarah Chen", username: "sarah-dev", avatar: "", commits: 234, prsMerged: 45, issuesClosed: 12, score: 98, type: "core" as const },
  { id: 2, name: "Mike Johnson", username: "mike-eng", avatar: "", commits: 189, prsMerged: 38, issuesClosed: 23, score: 92, type: "core" as const },
  { id: 3, name: "Alex Rivera", username: "alex-backend", avatar: "", commits: 156, prsMerged: 28, issuesClosed: 15, score: 85, type: "core" as const },
  { id: 4, name: "Emma Wilson", username: "emma-docs", avatar: "", commits: 45, prsMerged: 12, issuesClosed: 8, score: 67, type: "regular" as const },
  { id: 5, name: "James Lee", username: "james-new", avatar: "", commits: 3, prsMerged: 1, issuesClosed: 0, score: 15, type: "first-time" as const },
  { id: 6, name: "Lisa Park", username: "lisa-park", avatar: "", commits: 0, prsMerged: 0, issuesClosed: 0, score: 45, type: "inactive" as const },
];

export const planningItems = {
  planned: [
    { id: 1, title: "OAuth 2.0 Integration", description: "Add support for OAuth providers", linkedPR: null, linkedIssue: 189 },
    { id: 2, title: "Dashboard Redesign", description: "Modernize the analytics dashboard", linkedPR: null, linkedIssue: 201 },
  ],
  inProgress: [
    { id: 3, title: "Rate Limiting v2", description: "Implement adaptive rate limiting", linkedPR: 335, linkedIssue: 156 },
    { id: 4, title: "WebSocket Optimization", description: "Fix memory leaks and improve performance", linkedPR: 339, linkedIssue: 128 },
  ],
  shipped: [
    { id: 5, title: "API v3 Release", description: "New API version with breaking changes", linkedPR: 298, linkedIssue: null },
    { id: 6, title: "Dark Mode Support", description: "System-wide dark theme implementation", linkedPR: 312, linkedIssue: 145 },
  ],
};

export const chatMessages = [
  { id: 1, role: "assistant" as const, content: "Hello! I'm RepoMind Assistant. I can help you understand this repository, find relevant issues to work on, or explain the project structure. What would you like to know?" },
  { id: 2, role: "user" as const, content: "Can you explain the project structure?" },
  { id: 3, role: "assistant" as const, content: "The platform-core repository is organized into several key modules:\n\n**📁 /src/core** - Core business logic and domain models\n**📁 /src/api** - REST and GraphQL API handlers\n**📁 /src/services** - External service integrations\n**📁 /src/utils** - Shared utilities and helpers\n**📁 /tests** - Unit and integration tests\n\nThe main entry point is `src/index.ts`. Configuration is managed through environment variables defined in `.env.example`." },
  { id: 4, role: "user" as const, content: "What issues should I work on as a first-time contributor?" },
  { id: 5, role: "assistant" as const, content: "Great question! Here are some good first issues for new contributors:\n\n1. **#234 - Add input validation to user endpoints** (good-first-issue, documentation)\n2. **#256 - Fix typos in README** (good-first-issue)\n3. **#267 - Add unit tests for utils module** (good-first-issue, testing)\n\nI recommend starting with #256 as it's the simplest and will help you get familiar with our contribution workflow." },
];

export const activityEvents = [
  { id: 1, type: "pr-merged" as const, title: "PR #312 merged", description: "Dark Mode Support by @alex-backend", timestamp: "2 hours ago" },
  { id: 2, type: "release" as const, title: "v3.2.0 released", description: "Includes OAuth improvements and bug fixes", timestamp: "5 hours ago" },
  { id: 3, type: "issue-closed" as const, title: "Issue #145 closed", description: "Dark theme request completed", timestamp: "5 hours ago" },
  { id: 4, type: "deployment-failed" as const, title: "Deployment failed", description: "Production deployment failed on staging", timestamp: "8 hours ago" },
  { id: 5, type: "pr-opened" as const, title: "PR #342 opened", description: "feat: Add new authentication flow by @sarah-dev", timestamp: "14 days ago" },
  { id: 6, type: "pr-merged" as const, title: "PR #298 merged", description: "API v3 Release by @mike-eng", timestamp: "3 weeks ago" },
  { id: 7, type: "release" as const, title: "v3.0.0 released", description: "Major version with breaking API changes", timestamp: "3 weeks ago" },
];
