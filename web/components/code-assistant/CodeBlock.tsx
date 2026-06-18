'use client';

import React, { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { CopyOutlined, DownloadOutlined, CheckOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
  onCopy?: () => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  'c++': 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust',
  html: 'markup',
  css: 'css',
  sql: 'sql',
  json: 'json',
  yaml: 'yaml',
  bash: 'bash',
  shell: 'bash',
  tsx: 'tsx',
  jsx: 'jsx',
};

export default function CodeBlock(props: CodeBlockProps) {
  const { code, language = 'javascript', onCopy } = props;
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lineCount = code.split('\n').length;
  const isLongCode = lineCount > 15;
  const displayCode = expanded || !isLongCode ? code : code.split('\n').slice(0, 15).join('\n') + '\n// ...';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      message.success('代码已复制到剪贴板');
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const handleDownload = () => {
    const extension = getExtension(language);
    const fileName = `code-${Date.now()}.${extension}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已下载 ${fileName}`);
  };

  const syntaxLang = LANGUAGE_MAP[language.toLowerCase()] || 'javascript';

  return (
    <div className="rounded-lg overflow-hidden mb-4 border border-gray-700">
      {/* 顶部栏 */}
      <div className="bg-gray-800 text-gray-300 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-xs">{language}</span>
          {isLongCode && (
            <span className="text-gray-500 text-xs">{lineCount} 行</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isLongCode && (
            <Tooltip title={expanded ? '收起' : '展开全部'}>
              <Button
                type="text"
                size="small"
                icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-white"
              />
            </Tooltip>
          )}
          <Tooltip title="复制代码">
            <Button
              type="text"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              className={copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}
            />
          </Tooltip>
          <Tooltip title="下载文件">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              className="text-gray-400 hover:text-white"
            />
          </Tooltip>
        </div>
      </div>

      {/* 代码高亮区域 */}
      <SyntaxHighlighter
        language={syntaxLang}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        showLineNumbers={lineCount > 5}
        lineNumberStyle={{ color: '#4a5568', fontSize: '11px' }}
        wrapLines={true}
        wrapLongLines={true}
      >
        {displayCode}
      </SyntaxHighlighter>
    </div>
  );
}

function getExtension(language: string): string {
  const extensionMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    'c++': 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rs',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
  };

  return extensionMap[language.toLowerCase()] || 'txt';
}
