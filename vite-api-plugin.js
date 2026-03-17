import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Vite 플러그인: server/proxy.js를 대체하여 dev 서버에 API 미들웨어 통합
 * - 로컬 Git 커밋 수집
 * - Bitbucket API 프록시
 * - AI API 프록시 (Anthropic, OpenAI, Gemini)
 */
export default function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // JSON body 파싱 헬퍼
      const parseBody = (req) =>
        new Promise((resolve, reject) => {
          let data = '';
          req.on('data', (chunk) => (data += chunk));
          req.on('end', () => {
            try {
              resolve(data ? JSON.parse(data) : {});
            } catch {
              reject(new Error('Invalid JSON'));
            }
          });
          req.on('error', reject);
        });

      const sendJson = (res, status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };

      // ─── 로컬 Git 커밋 수집 ───
      server.middlewares.use('/api/git/commits', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

        try {
          const { repoPaths, authorName, dateFrom, dateTo } = await parseBody(req);

          if (!repoPaths?.length || !authorName) {
            return sendJson(res, 400, { error: 'repoPaths and authorName are required' });
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
              ], { cwd: resolved, encoding: 'utf-8', timeout: 10000 }).trim();

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
          sendJson(res, 200, { commits: allCommits });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
      });

      // ─── Bitbucket API 프록시 ───
      server.middlewares.use('/api/bitbucket/commits', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

        try {
          const { username, apiToken, workspace, repoSlugs, authorName, branch, dateFrom, dateTo } = await parseBody(req);

          if (!apiToken || !workspace || !repoSlugs?.length) {
            return sendJson(res, 400, { error: 'apiToken, workspace, repoSlugs are required' });
          }

          console.log(`[bitbucket] username: "${username}", workspace: "${workspace}", repoSlugs:`, repoSlugs);
          console.log(`[bitbucket] authorName: "${authorName}", branch: "${branch}", dateFrom: "${dateFrom}", dateTo: "${dateTo}"`);

          const allCommits = [];

          for (const repoSlug of repoSlugs) {
            try {
              let url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/commits`;
              if (branch) url += `/${encodeURIComponent(branch)}`;
              console.log(`[bitbucket] 요청 URL: ${url}`);
              let hasMore = true;

              const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');

              while (hasMore) {
                const response = await fetch(url, {
                  headers: { 'Authorization': `Basic ${auth}` },
                });

                if (!response.ok) {
                  const errText = await response.text().catch(() => '');
                  console.warn(`[bitbucket] ${workspace}/${repoSlug} 요청 실패: ${response.status}`, errText.slice(0, 300));
                  break;
                }

                const data = await response.json();

                for (const commit of data.values || []) {
                  const commitDate = commit.date?.substring(0, 10);
                  if (!commitDate) continue;
                  if (commitDate < dateFrom) { hasMore = false; break; }
                  if (commitDate > dateTo) continue;

                  const authorRaw = commit.author?.raw || '';
                  const authorUser = commit.author?.user?.display_name || '';
                  if (authorName && !authorRaw.includes(authorName) && !authorUser.includes(authorName)) continue;

                  allCommits.push({
                    hash: commit.hash?.substring(0, 7) || '',
                    message: commit.message?.trim() || '',
                    date: commitDate,
                    repo: repoSlug,
                  });
                }

                if (hasMore && data.next) { url = data.next; } else { hasMore = false; }
              }
            } catch (err) {
              console.warn(`[bitbucket] ${repoSlug} 처리 실패:`, err.message);
            }
          }

          allCommits.sort((a, b) => b.date.localeCompare(a.date));
          sendJson(res, 200, { commits: allCommits });
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
      });

      // ─── Anthropic API 프록시 ───
      server.middlewares.use('/api/anthropic', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

        const apiKey = req.headers['x-api-key'];
        if (!apiKey) return sendJson(res, 400, { error: 'API key is required' });

        try {
          const body = await parseBody(req);
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify(body),
          });

          const data = await response.json();
          sendJson(res, response.ok ? 200 : response.status, data);
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
      });

      // ─── OpenAI API 프록시 ───
      server.middlewares.use('/api/openai', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

        const apiKey = req.headers['x-api-key'];
        if (!apiKey) return sendJson(res, 400, { error: 'API key is required' });

        try {
          const body = await parseBody(req);
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
          });

          const data = await response.json();
          sendJson(res, response.ok ? 200 : response.status, data);
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
      });

      // ─── Gemini API 프록시 ───
      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

        const apiKey = req.headers['x-api-key'];
        if (!apiKey) return sendJson(res, 400, { error: 'API key is required' });

        try {
          const { model, ...body } = await parseBody(req);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            },
          );

          const data = await response.json();
          sendJson(res, response.ok ? 200 : response.status, data);
        } catch (err) {
          sendJson(res, 500, { error: err.message });
        }
      });
    },
  };
}
