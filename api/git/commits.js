import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  allCommits.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ commits: allCommits });
}
