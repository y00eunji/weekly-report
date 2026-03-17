export const PPTXGEN_CDN =
  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';

export const SYSTEM_PROMPT = `너는 주간보고서 데이터를 구조화하는 파서야. 사용자의 자유 텍스트 입력을 분석하여 반드시 아래 JSON 형식으로만 응답해.

## 핵심 규칙

### 1. 그룹핑 (매우 중요)
- 관련 작업들을 의미 있는 소제목으로 묶어야 한다.
- group_title은 상위 카테고리 역할이고, items는 그 아래 세부 작업들이다.
- 하나의 그룹에 items가 너무 많으면(5개 이상) 더 세분화하여 여러 그룹으로 나눈다.
- 그룹핑 예시:
  - "[기능개선] 기사 목록 검색 바 수정", "[기능개선] 단위 표시 제거", "[기능개선] 주소 검색 도메인 변경"
    → group_title: "기능 개선 및 수정", items: [각 세부 항목]
  - "[기능추가] 수입금 메모 적용", "[기능추가] 지급변경 버튼 추가", "[기능추가] 할부금 UI 개발"
    → group_title: "기능 추가 및 개발", items: [각 세부 항목]
  - "REV사 요구사항 리스트업 회의 진행"
    → group_title: "REV사 요구사항 협의", items: [{"text": "REV사 요구사항 리스트업 회의 진행", ...}]
- [기능개선], [기능추가] 같은 태그는 그룹핑 힌트로 활용하되, items의 text에는 태그를 제거하고 자연스러운 문장으로 작성한다.

### 2. 상태 표기
- 명시적으로 "진행중"이라고 하지 않으면 기본값은 "완료"
- "완료" / "진행중" 두 가지만 사용

### 3. 표현 순화 (매우 중요)
- "버그 수정" → "정상 동작하도록 수정"
- "이슈 수정" → "개선" 또는 "수정"
- "에러 수정" → "정상 처리되도록 수정"
- "버그", "이슈", "에러" 단어를 절대 사용하지 않는다
- items의 text에 "완료"라는 단어가 포함되지 않도록 한다 (status 필드에서 처리)

### 4. 금주 실적 vs 차주 계획
- "차주", "다음주", "next week" 등이 명시된 항목 → next_week
- 나머지 → this_week
- 차주 계획이 없으면 next_week는 빈 배열

## 응답 형식 (반드시 JSON만 출력, 다른 텍스트 절대 금지)

{
  "this_week": [
    {
      "group_title": "소제목 (카테고리)",
      "items": [
        {"text": "세부 작업 내용 1", "status": "완료"},
        {"text": "세부 작업 내용 2", "status": "완료"}
      ]
    },
    {
      "group_title": "다른 소제목",
      "items": [
        {"text": "세부 작업 내용", "status": "완료"}
      ]
    }
  ],
  "next_week": [
    {
      "group_title": "소제목",
      "items": [
        {"text": "계획 내용", "status": "진행중"}
      ]
    }
  ]
}`;

export const SYSTEM_PROMPT_BITBUCKET = `너는 주간보고서 데이터를 구조화하는 파서야. Git 커밋 메시지와 PR 내역을 분석하여 반드시 아래 JSON 형식으로만 응답해.

## 핵심 규칙

### 1. 커밋 메시지 분석 및 병합 (매우 중요)
- 커밋 메시지에서 실제 작업 내용을 추출한다.
- "fix:", "feat:", "refactor:", "chore:" 등의 접두어는 분류 힌트로 활용하되 제거한다.
- **같은 기능/파일/주제에 대한 커밋들은 반드시 하나로 합친다.**
  - 예: "fix: 주소 검색 오류 수정", "fix: 주소 검색 null 처리", "fix: 주소 검색 스타일 조정" → "주소 검색 기능 수정 및 개선" (1개로 병합)
  - 예: "feat: 할부금 UI 추가", "feat: 할부금 테이블 구현", "fix: 할부금 계산 로직" → "차량 할부금 UI 개발" (1개로 병합)
- 커밋 수가 많더라도 최종 items는 핵심 작업 단위로 압축한다. 커밋 10개가 같은 기능이면 item 1개로 충분하다.
- 의미 없는 커밋 ("merge", "conflict resolve", "wip", "test", "Merge branch" 등)은 제외한다.

### 2. 그룹핑 (매우 중요)
- 관련 작업들을 의미 있는 소제목으로 묶어야 한다.
- 레포지토리나 기능 단위로 자연스럽게 그룹핑한다.
- 하나의 그룹에 items가 너무 많으면(5개 이상) 더 세분화한다.

### 3. 상태 표기
- PR이 MERGED이면 "완료"
- PR이 OPEN이면 "진행중"
- 커밋만 있고 PR이 없으면 기본 "완료"

### 4. 표현 순화 (매우 중요)
- "버그 수정" → "정상 동작하도록 수정"
- "이슈 수정" → "개선" 또는 "수정"
- "에러 수정" → "정상 처리되도록 수정"
- "버그", "이슈", "에러" 단어를 절대 사용하지 않는다
- items의 text에 "완료"라는 단어가 포함되지 않도록 한다 (status 필드에서 처리)
- 커밋 메시지를 그대로 쓰지 말고, 보고서에 적합한 자연스러운 한국어 문장으로 변환한다

### 5. 금주 실적 vs 차주 계획 (매우 중요)
- 수집된 커밋/PR 내역은 모두 this_week (금주 실적)
- **차주 계획은 금주 실적을 기반으로 반드시 추론하여 생성한다. next_week를 빈 배열로 두지 않는다.**
- 추론 규칙:
  - 금주에 "진행중"인 작업 → 차주에 "계속 진행" 또는 "마무리" 항목으로 추가
  - 금주에 기능 개발을 완료한 경우 → 차주에 "QA 대응 및 피드백 반영", "테스트 및 검증" 등 후속 작업 추론
  - 금주에 수정/개선 작업이 많았으면 → 차주에 "안정화 및 모니터링" 추론
  - 추론된 차주 계획의 status는 모두 "진행중"으로 설정
- 차주 계획은 1~3개 그룹, 각 그룹 1~3개 항목 정도로 간결하게 작성

## 응답 형식 (반드시 JSON만 출력, 다른 텍스트 절대 금지)

{
  "this_week": [
    {
      "group_title": "소제목 (카테고리)",
      "items": [
        {"text": "세부 작업 내용 1", "status": "완료"},
        {"text": "세부 작업 내용 2", "status": "완료"}
      ]
    }
  ],
  "next_week": []
}`;

export const SAMPLE_INPUT = `REV사 요구사항 리스트업 회의 진행
[기능개선] 기사 목록 > 검색 바 입사일 기본값 null로 변경 완료
[기능개선] (원),(일) 단위 제거완료
[기능개선] 임직원 관련 "담당차량", "지급예정일"삭제 완료
[기능추가] 수입금 월별 상세 메모 = 일별 상세 메모에도 적용하기 완료
[기능추가] 임직원급여대장 지급상태 컬럼에 지급변경 버튼 추가 완료
[기능추가] 차량 할부금 UI 개발 완료
[기능개선] 3/10 주소 검색 서비스 도메인 변경에 따른 대비 완료

차주 계획:
REV사 QA 피드백 반영 및 수정 진행중`;

/**
 * 템플릿 기준 (LAYOUT_WIDE = 13.33 x 7.5 인치):
 * - 상단: 흰 배경에 검은 텍스트 (주간보고 | 이름, 날짜)
 * - 섹션 바: 검은 바 (금주 실적 | 차주 계획)
 * - 본문: 회색 테두리 박스 + 세로 구분선
 * - 푸터: 흰 배경에 AUTOCRYPT 로고 + Confidential
 */
export const SLIDE_CONFIG = {
  layout: 'LAYOUT_WIDE' as const,
  bg: { color: 'FFFFFF' },

  // 상단 타이틀 (흰 배경 + 검은 텍스트)
  title: {
    x: 0.5, y: 0.25, w: 8, h: 0.45,
    fontSize: 22, fontFace: '맑은 고딕',
    color: '000000', bold: true, align: 'left' as const,
  },
  date: {
    x: 10, y: 0.25, w: 2.83, h: 0.45,
    fontSize: 14, fontFace: '맑은 고딕',
    color: '000000', bold: true, align: 'right' as const,
  },

  // 금주 실적 | 차주 계획 섹션 헤더 바 (검은색)
  sectionBar: {
    x: 0.5, y: 0.9, w: 12.33, h: 0.4,
    fill: { color: '000000' },
  },
  labelThis: {
    x: 0.5, y: 0.93, w: 6.13, h: 0.34,
    fontSize: 13, fontFace: '맑은 고딕',
    color: 'FFFFFF', bold: true, align: 'center' as const,
  },
  labelNext: {
    x: 6.7, y: 0.93, w: 6.13, h: 0.34,
    fontSize: 13, fontFace: '맑은 고딕',
    color: 'FFFFFF', bold: true, align: 'center' as const,
  },

  // 본문 테두리 박스 (회색 아웃라인)
  contentBox: {
    x: 0.5, y: 1.3, w: 12.33, h: 5.4,
    line: { color: 'BBBBBB', width: 1 },
    fill: { color: 'FFFFFF' },
  },

  // 좌우 구분 세로선 (회색)
  dividerVertical: {
    x: 6.64, y: 1.3, w: 0.02, h: 5.4,
    fill: { color: 'BBBBBB' },
  },

  // 본문 영역
  contentThis: {
    x: 0.7, y: 1.4, w: 5.8, h: 5.2,
  },
  contentNext: {
    x: 6.85, y: 1.4, w: 5.8, h: 5.2,
  },

  // 하단 푸터 (흰 배경 + 어두운 텍스트)
  footerLeft: {
    x: 0.5, y: 7.0, w: 2.5, h: 0.36,
    fontSize: 11, fontFace: '맑은 고딕',
    color: '000000', bold: true, align: 'left' as const,
  },
  footerConfidentialBox: {
    x: 11.5, y: 7.05, w: 0.26, h: 0.26,
    fill: { color: 'E85D04' },
  },
  footerConfidentialNum: {
    x: 11.51, y: 7.04, w: 0.24, h: 0.28,
    fontSize: 10, fontFace: '맑은 고딕',
    color: 'FFFFFF', bold: true, align: 'center' as const,
  },
  footerConfidentialText: {
    x: 11.85, y: 7.0, w: 1.2, h: 0.36,
    fontSize: 9, fontFace: '맑은 고딕',
    color: '000000', align: 'left' as const,
  },
};
