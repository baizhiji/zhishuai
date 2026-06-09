/**
 * 数据导出服务 - 支持 Excel、CSV 格式
 */

import { Response } from 'express';

type ExportFormat = 'xlsx' | 'csv' | 'json';

interface ExportOptions {
  format: ExportFormat;
  filename: string;
}

/**
 * 导出客户数据为 Excel/CSV
 */
export async function exportCustomers(
  customers: any[],
  options: ExportOptions,
  res: Response
): Promise<void> {
  const { format, filename } = options;

  if (format === 'csv') {
    await exportToCSV(customers, filename, res, [
      { header: '姓名', key: 'name' },
      { header: '手机', key: 'phone' },
      { header: '公司', key: 'company' },
      { header: '职位', key: 'position' },
      { header: '等级', key: 'level' },
      { header: '意向度', key: 'intentLevel' },
      { header: '状态', key: 'status' },
      { header: '来源', key: 'source' },
      { header: '创建时间', key: 'createdAt' }
    ]);
  } else if (format === 'xlsx') {
    // 使用 JSON 导出作为备选（实际项目应安装 xlsx 库）
    await exportToCSV(customers, filename, res, [
      { header: '姓名', key: 'name' },
      { header: '手机', key: 'phone' },
      { header: '公司', key: 'company' },
      { header: '职位', key: 'position' },
      { header: '等级', key: 'level' },
      { header: '意向度', key: 'intentLevel' },
      { header: '状态', key: 'status' },
      { header: '来源', key: 'source' },
      { header: '创建时间', key: 'createdAt' }
    ]);
  } else {
    res.json({ success: true, data: customers });
  }
}

/**
 * 导出获客数据
 */
export async function exportAcquisitionData(
  data: any[],
  options: ExportOptions,
  res: Response
): Promise<void> {
  const { format, filename } = options;

  if (format === 'csv') {
    await exportToCSV(data, filename, res, [
      { header: '名称/公司', key: 'name' },
      { header: '类型', key: 'sourceType' },
      { header: '行业/业务', key: 'business' },
      { header: '地址', key: 'address' },
      { header: '电话', key: 'phone' },
      { header: '意向评分', key: 'intentScore' },
      { header: '意向等级', key: 'intentLevel' },
      { header: '标签', key: 'intentTags' },
      { header: '状态', key: 'status' },
      { header: '来源', key: 'source' },
      { header: '采集时间', key: 'createdAt' }
    ]);
  } else {
    res.json({ success: true, data });
  }
}

/**
 * 导出发布记录
 */
export async function exportPublishRecords(
  records: any[],
  options: ExportOptions,
  res: Response
): Promise<void> {
  const { format, filename } = options;

  if (format === 'csv') {
    await exportToCSV(records, filename, res, [
      { header: '标题', key: 'title' },
      { header: '平台', key: 'platform' },
      { header: '账号', key: 'accountName' },
      { header: '类型', key: 'contentType' },
      { header: '状态', key: 'status' },
      { header: '播放量', key: 'views' },
      { header: '点赞数', key: 'likes' },
      { header: '评论数', key: 'comments' },
      { header: '发布时间', key: 'publishedAt' }
    ]);
  } else {
    res.json({ success: true, data: records });
  }
}

/**
 * 导出统计数据
 */
export async function exportStatistics(
  stats: any,
  options: ExportOptions,
  res: Response
): Promise<void> {
  const { format, filename } = options;

  if (format === 'csv') {
    // 将统计数据转换为行格式
    const rows = flattenStats(stats);
    await exportToCSV(rows, filename, res, [
      { header: '指标', key: 'metric' },
      { header: '数值', key: 'value' },
      { header: '说明', key: 'description' }
    ]);
  } else {
    res.json({ success: true, data: stats });
  }
}

/**
 * 通用 CSV 导出
 */
async function exportToCSV(
  data: any[],
  filename: string,
  res: Response,
  columns: { header: string; key: string }[]
): Promise<void> {
  // 构建 CSV 内容
  const headers = columns.map(c => `"${c.header}"`).join(',');

  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];

      // 处理日期
      if (value instanceof Date) {
        value = value.toLocaleString('zh-CN');
      }

      // 处理 undefined/null
      if (value === undefined || value === null) {
        value = '';
      }

      // 转义和引号处理
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');

  // 设置响应头
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.csv"`);

  // 添加 BOM 以支持 Excel 打开 UTF-8 CSV
  res.write('\ufeff');
  res.end(csv);
}

/**
 * 将统计数据展平为行格式
 */
function flattenStats(stats: any, prefix = ''): { metric: string; value: string; description: string }[] {
  const rows: { metric: string; value: string; description: string }[] = [];

  for (const [key, value] of Object.entries(stats)) {
    const metric = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      rows.push(...flattenStats(value, metric));
    } else {
      rows.push({
        metric,
        value: String(value),
        description: getMetricDescription(key)
      });
    }
  }

  return rows;
}

/**
 * 获取指标描述
 */
function getMetricDescription(metric: string): string {
  const descriptions: Record<string, string> = {
    total: '总数',
    views: '播放/浏览量',
    likes: '点赞数',
    comments: '评论数',
    shares: '分享数',
    followers: '新增粉丝',
    customers: '客户数',
    leads: '线索数',
    conversions: '转化数'
  };

  return descriptions[metric] || metric;
}

/**
 * 生成导出文件名
 */
export function generateFilename(prefix: string, format: ExportFormat): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');

  return `${prefix}_${date}_${time}`;
}
