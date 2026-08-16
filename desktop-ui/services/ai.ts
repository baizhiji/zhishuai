/**
 * AI 统一服务层（V3.0 桌面安装版双通道）
 *
 * - 桌面版（Tauri WebView）：AI 请求经 `window.__TAURI__.core.invoke` 交给 Rust 主进程
 *   AI 代理（密钥在系统凭据管理器，不出主进程），命令名与 Rust 侧一致：`ai_generate_script`
 * - Web 版（浏览器/公共服务页）：走服务端 `/api/ai/generate-script`（用户自带 Key 模式）
 */
'use client';

import request from '@/utils/request';
import { isDesktop } from '@/utils/env';

export interface GenerateScriptParams {
  scene: string;
  sceneName?: string;
  scenePrompt?: string;
  style?: string;
  context?: string;
  maxTokens?: number;
}

export interface GenerateScriptResult {
  script: string;
  model?: string;
  provider?: string;
}

interface DesktopInvokeResult {
  script?: string;
  text?: string;
  content?: string;
  error?: string;
}

async function invokeDesktopAi(
  cmd: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const tauri = (window as any).__TAURI__;
  if (!tauri?.core?.invoke) {
    throw new Error('桌面端 AI 桥接不可用（__TAURI__.core.invoke 缺失）');
  }
  return tauri.core.invoke(cmd, payload) as Promise<Record<string, unknown>>;
}

/** AI 话术生成（双通道） */
export async function generateScript(
  params: GenerateScriptParams
): Promise<GenerateScriptResult> {
  // 桌面版：走 Rust 主进程 AI 代理
  if (isDesktop) {
    const result = (await invokeDesktopAi('ai_generate_script', {
      scene: params.scene,
      sceneName: params.sceneName || params.scene,
      scenePrompt: params.scenePrompt || '',
      style: params.style || '',
      context: params.context || '',
      maxTokens: params.maxTokens || 500,
    })) as DesktopInvokeResult;

    if (result.error) {
      throw new Error(result.error);
    }
    return { script: result.script || result.text || result.content || '' };
  }

  // Web 版：服务端路由（用户自带 Key）
  const data = await request.post('/api/ai/generate-script', {
    scene: params.scene,
    sceneName: params.sceneName || params.scene,
    scenePrompt: params.scenePrompt || '',
    style: params.style || '',
    context: params.context || '',
    maxTokens: params.maxTokens || 500,
  });
  const payload = (data?.data ?? data) as { script?: string; text?: string; content?: string };
  return { script: payload.script || payload.text || payload.content || '' };
}
