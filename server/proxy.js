import express from 'express';
import cors from 'cors';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Anthropic API proxy
app.post('/api/anthropic', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OpenAI API proxy
app.post('/api/openai', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini API proxy
app.post('/api/gemini', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const { model, ...body } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Local Git - 커밋 수집
app.post('/api/git/commits', (req, res) => {
  const { repoPaths, authorName, dateFrom, dateTo } = req.body;

  if (!repoPaths || !repoPaths.length || !authorName) {
    return res.status(400).json({ error: 'repoPaths and authorName are required' });
  }

  const allCommits = [];

  for (const repoPath of repoPaths) {
    const resolved = path.resolve(repoPath.replace(/^~/, os.homedir()));

    if (!fs.existsSync(resolved)) {
      console.warn(`[git] 경로 없음: ${resolved}`);
      continue;
    }

    const repoName = path.basename(resolved);

    try {
      const SEP = '|||';
      const COMMIT_SEP = '===COMMIT===';
      const format = `${COMMIT_SEP}%h${SEP}%s${SEP}%b${SEP}%ad`;

      const output = execFileSync('git', [
        'log', '--all',
        `--author=${authorName}`,
        `--after=${dateFrom}`,
        `--before=${dateTo}T23:59:59`,
        `--pretty=format:${format}`,
        '--date=short',
      ], {
        cwd: resolved,
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();

      if (!output) continue;

      for (const block of output.split(COMMIT_SEP)) {
        const trimmed = block.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(SEP);
        const hash = parts[0]?.trim();
        const subject = parts[1]?.trim();
        const body = parts[2]?.trim() || '';
        const date = parts[3]?.trim();
        if (!hash || !subject) continue;
        const message = body ? `${subject}\n${body}` : subject;
        allCommits.push({ hash, message, date, repo: repoName });
      }
    } catch (err) {
      console.warn(`[git] ${repoName} 처리 실패:`, err.message);
    }
  }

  // 날짜 최신순
  allCommits.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ commits: allCommits });
});

// Bitbucket API proxy - 커밋 수집
app.post('/api/bitbucket/commits', async (req, res) => {
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
          const commitDate = commit.date?.substring(0, 10); // YYYY-MM-DD
          if (!commitDate) continue;

          // 날짜 범위 밖이면 더 이상 볼 필요 없음 (커밋은 최신순)
          if (commitDate < dateFrom) {
            hasMore = false;
            break;
          }
          if (commitDate > dateTo) continue;

          // 작성자 필터
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

        // 다음 페이지
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
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://localhost:${PORT} (${process.platform})`);
});
