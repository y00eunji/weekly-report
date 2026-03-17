import { loadSettings } from './settings';

const PROXY_BASE = 'http://localhost:3001/api';

export interface GitCommit {
  hash: string;
  message: string;
  date: string;
  repo: string;
}

export interface GitData {
  commits: GitCommit[];
}

// 로컬 Git 레포에서 커밋 수집
export const fetchLocalGitData = async (
  dateFrom: string,
  dateTo: string,
): Promise<GitData> => {
  const { git } = loadSettings();

  if (!git.repoPaths.length) {
    throw new Error('Git 레포 경로가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }
  if (!git.authorName) {
    throw new Error('Git Author 이름이 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }

  const res = await fetch(`${PROXY_BASE}/git/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoPaths: git.repoPaths,
      authorName: git.authorName,
      dateFrom,
      dateTo,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Git 커밋 수집 실패: ${res.status} - ${err}`);
  }

  return res.json();
};

// 수집된 커밋 데이터를 AI 입력용 텍스트로 변환
export const formatGitDataForAI = (data: GitData): string => {
  if (data.commits.length === 0) {
    return '해당 기간에 커밋 내역이 없습니다.';
  }

  const lines: string[] = ['## 커밋 내역'];

  // 레포별로 그룹핑
  const byRepo = new Map<string, GitCommit[]>();
  for (const c of data.commits) {
    const arr = byRepo.get(c.repo) || [];
    arr.push(c);
    byRepo.set(c.repo, arr);
  }

  for (const [repo, commits] of byRepo) {
    lines.push(`\n### ${repo}`);
    for (const c of commits) {
      const firstLine = c.message.split('\n')[0].trim();
      if (firstLine) lines.push(`- ${firstLine}`);
    }
  }

  return lines.join('\n');
};
