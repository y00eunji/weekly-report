import { loadSettings } from './settings';
import { postToProxy } from './utils';
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

  return postToProxy<GitData>(
    API_BASE,
    payload,
    'GitHub API 프록시에 연결할 수 없습니다.',
    'GitHub',
  );
};
