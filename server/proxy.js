import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
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
    const resolved = repoPath.replace(/^~/, os.homedir());

    // 경로 존재 확인
    if (!fs.existsSync(resolved)) {
      continue;
    }

    // 레포 이름 = 폴더명
    const repoName = path.basename(resolved);

    try {
      // git log: hash, message, date를 구분자로 파싱
      const SEP = '|||';
      const cmd = `git log --all --author="${authorName}" --after="${dateFrom}" --before="${dateTo}T23:59:59" --pretty=format:"%h${SEP}%s${SEP}%ad" --date=short`;
      const output = execSync(cmd, {
        cwd: resolved,
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();

      if (!output) continue;

      for (const line of output.split('\n')) {
        const [hash, message, date] = line.split(SEP);
        if (!hash || !message) continue;
        allCommits.push({ hash, message, date, repo: repoName });
      }
    } catch {
      // git이 아닌 폴더거나 에러 시 무시
    }
  }

  // 날짜 최신순
  allCommits.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ commits: allCommits });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
