import { loadSettings } from './settings';
import type { GitData } from './git';

const API_BASE = '/api/github/commits';

export const fetchGitHubCommits = async (
  dateFrom: string,
  dateTo: string,
): Promise<GitData> => {
  const { github } = loadSettings();

  if (!github.token) {
    throw new Error('GitHub 토큰이 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }
  if (!github.repos.length) {
    throw new Error('GitHub 레포지토리가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }

  const payload = {
    token: github.token,
    repos: github.repos,
    authorName: github.authorName,
    branch: github.branch || '',
    dateFrom,
    dateTo,
  };

  let res: Response;
  try {
    res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('GitHub API 프록시에 연결할 수 없습니다.');
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub 커밋 수집 실패: ${res.status} - ${err}`);
  }

  return res.json();
};
