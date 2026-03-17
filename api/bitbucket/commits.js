export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, apiToken, workspace, repoSlugs, authorName, branch, dateFrom, dateTo } = req.body;

  if (!apiToken || !workspace || !repoSlugs?.length) {
    return res.status(400).json({ error: 'apiToken, workspace, repoSlugs are required' });
  }

  const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');
  const allCommits = [];

  for (const repoSlug of repoSlugs) {
    try {
      let url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/commits`;
      if (branch) url += `/${encodeURIComponent(branch)}`;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(url, {
          headers: { 'Authorization': `Basic ${auth}` },
        });

        if (!response.ok) {
          console.warn(`[bitbucket] ${workspace}/${repoSlug} 요청 실패: ${response.status}`);
          break;
        }

        const data = await response.json();

        for (const commit of data.values || []) {
          const commitDate = commit.date?.substring(0, 10);
          if (!commitDate) continue;

          if (commitDate < dateFrom) {
            hasMore = false;
            break;
          }
          if (commitDate > dateTo) continue;

          const authorRaw = commit.author?.raw || '';
          const authorUser = commit.author?.user?.display_name || '';
          if (authorName && !authorRaw.includes(authorName) && !authorUser.includes(authorName)) {
            continue;
          }

          const message = commit.message?.trim() || '';
          const hash = commit.hash?.substring(0, 7) || '';
          allCommits.push({
            hash,
            message,
            date: commitDate,
            repo: repoSlug,
          });
        }

        if (hasMore && data.next) {
          url = data.next;
        } else {
          hasMore = false;
        }
      }
    } catch (err) {
      console.warn(`[bitbucket] ${repoSlug} 처리 실패:`, err.message);
    }
  }

  allCommits.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ commits: allCommits });
}
