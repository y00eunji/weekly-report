export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, repos, authorName, branch, dateFrom, dateTo } = req.body;

  if (!token || !repos?.length) {
    return res.status(400).json({ error: 'token and repos are required' });
  }

  const allCommits = [];

  for (const repo of repos) {
    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          since: `${dateFrom}T00:00:00Z`,
          until: `${dateTo}T23:59:59Z`,
          per_page: '100',
          page: String(page),
        });
        if (branch) params.set('sha', branch);
        if (authorName) params.set('author', authorName);

        const url = `https://api.github.com/repos/${repo}/commits?${params}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
          },
        });

        if (!response.ok) {
          console.warn(`[github] ${repo} 요청 실패: ${response.status}`);
          break;
        }

        const data = await response.json();
        if (!data.length) { hasMore = false; break; }

        for (const commit of data) {
          const commitDate = commit.commit?.author?.date?.substring(0, 10) || '';
          allCommits.push({
            hash: commit.sha?.substring(0, 7) || '',
            message: commit.commit?.message?.trim() || '',
            date: commitDate,
            repo: repo.split('/').pop() || repo,
          });
        }

        page++;
        if (data.length < 100) hasMore = false;
      }
    } catch (err) {
      console.warn(`[github] ${repo} 처리 실패:`, err.message);
    }
  }

  allCommits.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ commits: allCommits });
}
