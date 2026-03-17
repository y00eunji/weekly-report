import { loadSettings } from './settings';
import type { GitData, GitCommit } from './git';

const API_BASE = '/api/bitbucket/commits';

// Bitbucket에서 커밋 수집
export const fetchBitbucketCommits = async (
  dateFrom: string,
  dateTo: string,
): Promise<GitData> => {
  const { bitbucket } = loadSettings();

  if (!bitbucket.workspace) {
    throw new Error('Bitbucket 워크스페이스가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }
  if (!bitbucket.repoSlugs.length) {
    throw new Error('Bitbucket 레포지토리가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }
  if (!bitbucket.username || !bitbucket.apiToken) {
    throw new Error('Bitbucket 인증 정보가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }

  const payload = {
    username: bitbucket.username,
    apiToken: bitbucket.apiToken,
    workspace: bitbucket.workspace,
    repoSlugs: bitbucket.repoSlugs,
    authorName: bitbucket.authorName,
    branch: bitbucket.branch || '',
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
    throw new Error('Bitbucket API 프록시에 연결할 수 없습니다.');
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bitbucket 커밋 수집 실패: ${res.status} - ${err}`);
  }

  return res.json();
};
