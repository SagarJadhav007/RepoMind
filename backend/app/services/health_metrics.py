
def health_score(open_prs, open_issues, commits_30d, contributors):
    score = 100

    if open_prs > 20:
        score -= 10
    if open_issues > 50:
        score -= 15
    if commits_30d < 10:
        score -= 20
    if contributors < 3:
        score -= 10

    return max(score, 0)


def pr_merge_rate(closed_prs):
    if not closed_prs:
        return 100

    merged = [pr for pr in closed_prs if pr.get("merged_at")]
    return int((len(merged) / len(closed_prs)) * 100)
