import type { FullReportData, ReportGroup } from "../types/report";
import { SLIDE_CONFIG } from "./constants";

declare global {
  interface Window {
    PptxGenJS: new () => PptxGenInstance;
  }
}

interface PptxGenInstance {
  layout: string;
  ShapeType: { rect: string };
  addSlide: () => PptxSlide;
  writeFile: (opts: { fileName: string }) => Promise<void>;
}

interface PptxSlide {
  background: { color: string };
  addText: (
    text: string | PptxTextRow[],
    opts: Record<string, unknown>,
  ) => void;
  addShape: (shape: string, opts: Record<string, unknown>) => void;
}

interface PptxTextRow {
  text: string;
  options: Record<string, unknown>;
}

const buildContentRows = (groups: ReportGroup[]): PptxTextRow[] =>
  groups.flatMap(({ group_title, items }, groupIdx) => [
    // 그룹 소제목 (볼드, bullet 없음, 들여쓰기 없음)
    {
      text: group_title,
      options: {
        fontSize: 10,
        fontFace: "맑은 고딕",
        bold: true,
        color: "000000",
        paraSpaceBefore: groupIdx === 0 ? 0 : 12,
        paraSpaceAfter: 4,
        bullet: false,
        indent: 0,
        breakLine: true,
      },
    },
    // 하위 항목 (bullet + 들여쓰기)
    ...items.map(({ text, status }) => ({
      text: `${text}  ${status}`,
      options: {
        fontSize: 9,
        fontFace: "맑은 고딕",
        color: "333333",
        paraSpaceBefore: 1,
        paraSpaceAfter: 1,
        bullet: { code: "2022" },
        indent: 0.35,
        breakLine: true,
      },
    })),
  ]);

const FOOTER_LOGO = "AUTOCRYPT";
const SLIDE_NUMBER = 2;
const CONFIDENTIAL_TEXT = "Confidential \u2013 Internal Only";

export const generatePptx = async (data: FullReportData): Promise<string> => {
  const pptx = new window.PptxGenJS();
  pptx.layout = SLIDE_CONFIG.layout;

  const slide = pptx.addSlide();
  slide.background = SLIDE_CONFIG.bg;

  // 상단 타이틀 (흰 배경 + 검은 텍스트)
  slide.addText(`주간보고 | ${data.name}`, SLIDE_CONFIG.title);
  slide.addText(data.date, SLIDE_CONFIG.date);

  // 금주 실적 | 차주 계획 섹션 바 + 라벨
  slide.addShape(pptx.ShapeType.rect, SLIDE_CONFIG.sectionBar);
  slide.addText("금주 실적", SLIDE_CONFIG.labelThis);
  slide.addText("차주 계획", SLIDE_CONFIG.labelNext);

  // 본문 테두리 박스
  slide.addShape(pptx.ShapeType.rect, SLIDE_CONFIG.contentBox);

  // 좌우 구분 세로선
  slide.addShape(pptx.ShapeType.rect, SLIDE_CONFIG.dividerVertical);

  // 본문
  const thisWeekRows = buildContentRows(data.this_week || []);
  if (thisWeekRows.length > 0) {
    slide.addText(thisWeekRows, {
      ...SLIDE_CONFIG.contentThis,
      valign: "top",
      lineSpacingMultiple: 1.2,
    });
  }

  const nextWeekRows = buildContentRows(data.next_week || []);
  if (nextWeekRows.length > 0) {
    slide.addText(nextWeekRows, {
      ...SLIDE_CONFIG.contentNext,
      valign: "top",
      lineSpacingMultiple: 1.2,
    });
  }

  // 하단 푸터 (흰 배경)
  slide.addText(FOOTER_LOGO, SLIDE_CONFIG.footerLeft);
  slide.addShape(pptx.ShapeType.rect, SLIDE_CONFIG.footerConfidentialBox);
  slide.addText(String(SLIDE_NUMBER), SLIDE_CONFIG.footerConfidentialNum);
  slide.addText(CONFIDENTIAL_TEXT, SLIDE_CONFIG.footerConfidentialText);

  const fileName = `${data.name}_주간보고_${data.date.replace(/\//g, "-")}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
};
