import { loadSettings } from './settings';
import { postToProxy } from './utils';
import type { GitData } from './git';

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

  return postToProxy<GitData>(
    API_BASE,
    payload,
    'Bitbucket API 프록시에 연결할 수 없습니다.',
    'Bitbucket',
  );
};
