'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DownOutlined, SendOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import PageContainer from '@/components/customer/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { getAccounts } from '@/services/social-account';
import type { SocialAccount } from '@/services/social-account';
import {
  getLimits,
  getRecords,
  getRiskStatus,
  getTodayQuota,
  previewScript,
  reportDeliveryStatus,
  sendComment,
} from '@/services/comment-delivery';
import type {
  DeliveryRecord,
  PlatformLimit,
  PreviewScript,
  RecordsPage,
  RiskStatus,
} from '@/services/comment-delivery';

const PLATFORM_OPTIONS = [
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'xiaohongshu', label: '小红书' },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  success: { label: '已发送', color: 'success' },
  pending: { label: '待发送', color: 'processing' },
  failed: { label: '失败', color: 'error' },
  deleted: { label: '被删除', color: 'error' },
  limited: { label: '被限流', color: 'warning' },
  folded: { label: '被折叠', color: 'default' },
};

interface SendForm {
  platform: string;
  accountId?: string;
  targetUrl: string;
  topic?: string;
}

export default function AcquisitionCommentPage() {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [form] = Form.useForm<SendForm>();
  const selectedPlatform = Form.useWatch('platform', form);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [limits, setLimits] = useState<PlatformLimit[]>([]);
  const [risk, setRisk] = useState<RiskStatus[]>([]);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  const [preview, setPreview] = useState<PreviewScript | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [records, setRecords] = useState<RecordsPage>({ total: 0, page: 1, pageSize: 20, records: [] });
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const loadAccounts = useCallback(async () => {
    if (!userId) return;
    try {
      setAccounts(await getAccounts(userId));
    } catch (e: any) {
      message.error(e?.message || '加载账号失败');
    }
  }, [userId]);

  const loadLimits = useCallback(async () => {
    try {
      setLimits(await getLimits());
    } catch {
      // 限额加载失败不阻塞
    }
  }, []);

  const loadRisk = useCallback(async () => {
    try {
      setRisk(await getRiskStatus());
    } catch {
      // 风控加载失败不阻塞
    }
  }, []);

  const loadRecords = useCallback(async (pageNum: number) => {
    setRecordsLoading(true);
    try {
      const data = await getRecords({ page: pageNum, pageSize: 20 });
      setRecords(data);
    } catch (e: any) {
      message.error(e?.message || '加载记录失败');
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    loadLimits();
    loadRisk();
    loadRecords(1);
  }, [loadAccounts, loadLimits, loadRisk, loadRecords]);

  useEffect(() => {
    if (!selectedPlatform) {
      setQuota(null);
      return;
    }
    getTodayQuota(selectedPlatform)
      .then(setQuota)
      .catch(() => setQuota(null));
  }, [selectedPlatform]);

  const platformAccounts = useMemo(
    () =>
      accounts.filter(
        (acc) => acc.platform === selectedPlatform && acc.status === 'active'
      ),
    [accounts, selectedPlatform]
  );

  const brokenAccounts = useMemo(() => risk.filter((r) => r.isBroken), [risk]);

  const handlePreview = async () => {
    const { platform, topic } = form.getFieldsValue();
    if (!platform) {
      message.warning('请先选择平台');
      return;
    }
    setPreviewLoading(true);
    try {
      const data = await previewScript(platform, topic);
      setPreview(data);
    } catch (e: any) {
      message.error(e?.message || '生成话术失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      const result = await sendComment({
        platform: values.platform,
        targetUrl: values.targetUrl,
        topic: values.topic,
        accountId: values.accountId,
      });
      if (result.success) {
        message.success(result.message || '发送成功');
        setPreview(null);
        form.setFieldsValue({ accountId: undefined });
        loadRecords(1);
        setPage(1);
        if (selectedPlatform) {
          getTodayQuota(selectedPlatform).then(setQuota).catch(() => setQuota(null));
        }
        loadRisk();
      } else {
        message.warning(result.message || '发送被拦截');
        if (result.blockedReason) {
          message.info(`原因：${result.blockedReason}`);
        }
      }
    } catch (e: any) {
      message.error(e?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (recordId: string, status: 'deleted' | 'limited' | 'folded') => {
    try {
      await reportDeliveryStatus(recordId, status);
      message.success('已上报，将自动调整风控策略');
      loadRisk();
      loadRecords(page);
    } catch (e: any) {
      message.error(e?.message || '上报失败');
    }
  };

  const reportMenu = (recordId: string): MenuProps => ({
    items: [
      { key: 'deleted', label: '评论被删除' },
      { key: 'limited', label: '被限流（评论不展示）' },
      { key: 'folded', label: '被折叠' },
    ],
    onClick: ({ key }) => handleReport(recordId, key as 'deleted' | 'limited' | 'folded'),
  });

  const columns: ColumnsType<DeliveryRecord> = [
    {
      title: '平台',
      dataIndex: 'platformName',
      width: 100,
      render: (v: string, r: DeliveryRecord) => <Tag>{v || r.platform}</Tag>,
    },
    { title: '账号', dataIndex: 'accountName', width: 140, render: (v?: string | null) => v || '—' },
    {
      title: '目标链接',
      dataIndex: 'targetUrl',
      ellipsis: true,
      render: (v: string) => (
        <a href={v} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
          {v}
        </a>
      ),
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      ellipsis: true,
      width: 280,
      render: (v: string) => <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const meta = STATUS_META[v] || { label: v, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作',
      key: 'actions',
      width: 110,
      render: (_: unknown, r: DeliveryRecord) =>
        r.status === 'success' ? (
          <Dropdown menu={reportMenu(r.id)}>
            <Button size="small" type="link">
              反馈状态 <DownOutlined />
            </Button>
          </Dropdown>
        ) : (
          '—'
        ),
    },
  ];

  const limitMap = useMemo(() => {
    const map: Record<string, PlatformLimit> = {};
    limits.forEach((l) => {
      map[l.platform] = l;
    });
    return map;
  }, [limits]);

  return (
    <PageContainer
      title="跟评中心"
      description="基于已授权账号自动发送智能评论，内置话术去重、违禁词过滤、差异化频控与失败熔断"
      breadcrumb={[{ title: '智能获客', href: '/customer/acquisition/board' }, { title: '跟评中心' }]}
    >
      <Row gutter={16}>
        {/* 发送表单 */}
        <Col xs={24} lg={10} style={{ marginBottom: 16 }}>
          <Card title="发送智能跟评" bordered={false}>
            <Form form={form} layout="vertical" initialValues={{ platform: undefined }}>
              <Form.Item
                name="platform"
                label="目标平台"
                rules={[{ required: true, message: '请选择平台' }]}
              >
                <Select
                  placeholder="选择平台"
                  options={PLATFORM_OPTIONS}
                  onChange={() => {
                    form.setFieldsValue({ accountId: undefined });
                    setPreview(null);
                  }}
                />
              </Form.Item>

              <Form.Item name="accountId" label="发送账号">
                <Select
                  placeholder={
                    platformAccounts.length > 0
                      ? '默认自动选择（也可指定）'
                      : '该平台暂无已授权账号，请先到「平台账号授权」页完成授权'
                  }
                  options={platformAccounts.map((acc) => ({
                    value: acc.id,
                    label: `${acc.platformName} · ${acc.accountName || '未命名'}`,
                  }))}
                  notFoundContent={
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无已授权账号"
                      style={{ padding: 12 }}
                    />
                  }
                />
              </Form.Item>

              <Form.Item
                name="targetUrl"
                label="目标链接"
                rules={[{ required: true, message: '请输入目标链接' }]}
                extra="视频 / 笔记 / 文章的链接地址"
              >
                <Input placeholder="https://…" />
              </Form.Item>

              <Form.Item name="topic" label="主题词（可选）">
                <Input placeholder="如：AI 工具测评、职场干货" maxLength={30} />
              </Form.Item>

              <Space wrap>
                <Button onClick={handlePreview} loading={previewLoading}>
                  预览话术
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sending}
                  onClick={handleSend}
                >
                  发送跟评
                </Button>
              </Space>
            </Form>

            {preview && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: '#f7f7f8',
                }}
              >
                <Typography.Text strong>话术预览</Typography.Text>
                <Typography.Paragraph style={{ marginTop: 8, marginBottom: 4, fontSize: 13 }}>
                  {preview.script || '（无内容）'}
                </Typography.Paragraph>
                {preview.violations.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                    message={`已过滤违禁内容 ${preview.violations.length} 处`}
                    description={preview.violations.join('、')}
                  />
                )}
                {preview.deduped && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    已启用近 7 天话术去重
                  </Typography.Text>
                )}
              </div>
            )}
          </Card>
        </Col>

        {/* 额度 + 风控 */}
        <Col xs={24} lg={14} style={{ marginBottom: 16 }}>
          <Card title="今日发送额度" bordered={false} style={{ marginBottom: 16 }}>
            {quota && quota.limit > 0 ? (
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Typography.Text>
                    当前平台今日已发 <b>{quota.used}</b> / {quota.limit} 条
                  </Typography.Text>
                  <Typography.Text type="secondary">剩余 {quota.remaining} 条</Typography.Text>
                </Space>
                <Progress
                  percent={Math.min(100, Math.round((quota.used / quota.limit) * 100))}
                  status={quota.remaining <= 3 ? 'exception' : 'active'}
                />
              </div>
            ) : (
              <Typography.Text type="secondary">选择平台后显示今日额度</Typography.Text>
            )}

            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
              平台安全限额（每小时 / 每天）：
              {PLATFORM_OPTIONS.map((p) => {
                const l = limitMap[p.value];
                return (
                  <span key={p.value} style={{ marginRight: 8 }}>
                    {p.label} {l ? `${l.perHour}条/时 · ${l.perDay}条/天` : '—'}
                  </span>
                );
              })}
            </Typography.Text>
          </Card>

          <Card title="风控状态" bordered={false}>
            {brokenAccounts.length > 0 ? (
              <Alert
                type="error"
                showIcon
                message={`${brokenAccounts.length} 个账号已触发平台熔断`}
                description={brokenAccounts
                  .map(
                    (r) =>
                      `${r.platformName} · ${r.accountName || '未知账号'}：近24h失败率 ${Math.round(r.failureRate * 100)}%`
                  )
                  .join('；')}
              />
            ) : risk.length === 0 ? (
              <Typography.Text type="secondary">暂无账号，完成授权后自动监测</Typography.Text>
            ) : (
              <Alert
                type="success"
                showIcon
                message="全部账号运行正常"
                description="系统持续监测删评/限流率，触发阈值后将自动暂停该平台发送。"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 发送记录 */}
      <Card title={`发送记录（共 ${records.total} 条）`} bordered={false}>
        <Table<DeliveryRecord>
          rowKey="id"
          columns={columns}
          dataSource={records.records}
          loading={recordsLoading}
          pagination={{
            current: page,
            pageSize: records.pageSize || 20,
            total: records.total,
            showSizeChanger: false,
            onChange: (p) => {
              setPage(p);
              loadRecords(p);
            },
          }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无发送记录" />
            ),
          }}
        />
      </Card>
    </PageContainer>
  );
}
