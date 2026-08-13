/**
 * AIGC 内容标识服务
 * 依据《互联网信息服务深度合成管理规定》《生成式人工智能服务管理暂行办法》，
 * 所有 AI 生成内容必须标注「【智枢AI生成】」标识。
 */

export const AIGC_LABEL = '【智枢AI生成】';

/**
 * 为 AI 生成文本追加 AIGC 标识（避免重复追加）
 */
export function appendAIGCLabel(content: string): string {
  if (!content) return content;
  if (content.includes(AIGC_LABEL)) return content;
  return `${content}\n\n— — — — —\n本内容由${AIGC_LABEL}，请注意甄别。`;
}

/**
 * 为 AI 生成的短标题追加标识（用 · 分隔，不换行）
 */
export function appendAIGCLabelShort(content: string): string {
  if (!content) return content;
  if (content.includes(AIGC_LABEL)) return content;
  return `${content} · ${AIGC_LABEL}`;
}

/**
 * 判断内容是否已含 AIGC 标识
 */
export function hasAIGCLabel(content: string): boolean {
  return content.includes(AIGC_LABEL);
}

export default { AIGC_LABEL, appendAIGCLabel, appendAIGCLabelShort, hasAIGCLabel };
