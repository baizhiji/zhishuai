'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  HistoryOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import PageContainer from '@/components/customer/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { getAccounts } from '@/services/social-account';
import type { SocialAccount } from '@/services/social-account';
import {
  createAutoCommentTask,
  deleteAutoCommentTask,
  getAutoCommentRecords,
  getAutoCommentTasks,
  getLimits,
  getRecords,
  getRiskStatus,
  getTodayQuota,
  previewScript,
  reportDeliveryStatus,
  runAutoCommentTask,
  sendComment,
  updateAutoCommentTask,
} from '@/services/comment-delivery';
import type {
  AutoCommentRecord,
  AutoCommentTask,
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

  // 自动跟评任务
  const [tasks, setTasks] = useState<AutoCommentTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AutoCommentTask | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [recordsModal, setRecordsModal] = useState<{ open: boolean; task: AutoCommentTask | null; records: AutoCommentRecord[]; loading: boolean }>({
    open: false,
    task: null,
    records: [],
    loading: false,
  });
  const [taskForm] = Form.useForm();

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

  // ─── 自动跟评任务 ──────────────────────────────
  const loadTasks = useCallback(async () => {
    if (!userId) return;
    setTasksLoading(true);
    try {
      setTasks(await getAutoCommentTasks());
    } catch (e: any) {
      message.error(e?.message || '加载任务失败');
    } finally {
      setTasksLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadTasks();
  }, [userId, loadTasks]);

  const openCreateTask = () => {
    setEditingTask(null);
    taskForm.resetFields();
    taskForm.setFieldsValue({ platform: 'douyin', intervalMinutes: 60, dailyLimit: 20, active: true });
    setTaskModalOpen(true);
  };

  const openEditTask = (task: AutoCommentTask) => {
    setEditingTask(task);
    taskForm.setFieldsValue({
      name: task.name,
      platform: task.platform,
      targetUrls: (task.targetUrls || []).join('\n'),
      intervalMinutes: task.intervalMinutes,
      dailyLimit: task.dailyLimit,
      active: task.active,
    });
    setTaskModalOpen(true);
  };

  const handleTaskSave = async () => {
    const values = await taskForm.validateFields();
    const targetUrls = String(values.targetUrls || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (targetUrls.length === 0) {
      message.warning('请至少填写一个目标内容链接');
      return;
    }
    setTaskSaving(true);
    try {
      const payload = {
        name: values.name,
        platform: values.platform,
        targetUrls,
        intervalMinutes: values.intervalMinutes,
        dailyLimit: values.dailyLimit,
        active: values.active ?? true,
      };
      if (editingTask) {
        await updateAutoCommentTask(editingTask.id, payload);
        message.success('任务已更新');
      } else {
        await createAutoCommentTask(payload);
        message.success('任务已创建，调度器将自动执行');
      }
      setTaskModalOpen(false);
      loadTasks();
    } catch (e: any) {
      message.error(e?.message || '保存任务失败');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleToggleTask = async (task: AutoCommentTask, active: boolean) => {
    try {
      await updateAutoCommentTask(task.id, { active });
      message.success(active ? '任务已启用' : '任务已暂停');
      loadTasks();
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    }
  };

  const handleRunTask = async (task: AutoCommentTask) => {
    setRunningTaskId(task.id);
    try {
      const r = await runAutoCommentTask(task.id);
      message.success(
        `执行完成：处理 ${r.processed} 条，成功 ${r.sent} 条，跳过 ${r.skipped} 条${r.errors.length ? `，提示：${r.errors.join('；')}` : ''}`
      );
      loadTasks();
    } catch (e: any) {
      message.error(e?.message || '执行失败');
    } finally {
      setRunningTaskId(null);
    }
  };

  const openTaskRecords = async (task: AutoCommentTask) => {
    setRecordsModal({ open: true, task, records: [], loading: true });
    try {
      const list = await getAutoCommentRecords(task.id);
      setRecordsModal((s) => ({ ...s, records: list, loading: false }));
    } catch (e: any) {
      message.error(e?.message || '加载记录失败');
      setRecordsModal((s) => ({ ...s, loading: false }));
    }
  };

  const handleDeleteTask = async (task: AutoCommentTask) => {
    try {
      await deleteAutoCommentTask(task.id);
      message.success('任务已删除');
      loadTasks();
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    }
  };

  const taskColumns: ColumnsType<AutoCommentTask> = [
    { title: '任务名称', dataIndex: 'name', ellipsis: true },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 90,
      render: (v: string) => {
        const label = PLATFORM_OPTIONS.find((p) => p.value === v)?.label || v;
        return <Tag>{label}</Tag>;
      },
    },
    { title: '目标链接', dataIndex: 'targetUrls', width: 180, ellipsis: true, render: (v: string[] | null) => `${v?.length || 0} 条` },
    { title: '执行间隔', dataIndex: 'intervalMinutes', width: 90, render: (v: number) => `${v} 分钟` },
    { title: '每日限额', dataIndex: 'dailyLimit', width: 90, render: (v: number) => `${v} 条` },
    {
      title: '状态',
      dataIndex: 'active',
      width: 90,
      render: (v: boolean, r: AutoCommentTask) => (
        <Switch size="small" checked={v} onChange={(checked) => handleToggleTask(r, checked)} />
      ),
    },
    {
      title: '上次执行',
      dataIndex: 'lastRunAt',
      width: 160,
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : '从未'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, r: AutoCommentTask) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<PlayCircleOutlined />} loading={runningTaskId === r.id} onClick={() => handleRunTask(r)}>
            执行
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => openTaskRecords(r)}>
            记录
          </Button>
          <Button type="link" size="small" onClick={() => openEditTask(r)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该任务？" onConfirm={() => handleDeleteTask(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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

      {/* 自动跟评任务 */}
      <Card
        title="自动跟评任务（全自动获客引流）"
        bordered={false}
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTask}>
              新建任务
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => loadTasks()}>
              刷新
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="定时自动对目标内容执行合规跟评：话术由 AI 生成并经过违禁词过滤、近 7 天去重与平台风控校验，每日限额与熔断自动保护账号安全。"
        />
        <Table<AutoCommentTask>
          rowKey="id"
          columns={taskColumns}
          dataSource={tasks}
          loading={tasksLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无自动跟评任务" /> }}
        />
      </Card>

      {/* 任务编辑 Modal */}
      <Modal
        title={editingTask ? '编辑自动跟评任务' : '新建自动跟评任务'}
        open={taskModalOpen}
        onOk={handleTaskSave}
        onCancel={() => setTaskModalOpen(false)}
        confirmLoading={taskSaving}
        width={560}
      >
        <Form form={taskForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="如：AI 行业内容跟评" maxLength={50} />
          </Form.Item>
          <Form.Item name="platform" label="目标平台" rules={[{ required: true, message: '请选择平台' }]}>
            <Select options={PLATFORM_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="targetUrls"
            label="目标内容链接（每行一个）"
            rules={[{ required: true, message: '请填写目标内容链接' }]}
            extra="每轮执行将对每条链接发送一条跟评；同一链接当日不重复发送。"
          >
            <Input.TextArea rows={4} placeholder={'https://www.douyin.com/video/…\nhttps://www.xiaohongshu.com/…'} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="intervalMinutes" label="执行间隔（分钟）" rules={[{ required: true }]}>
                <InputNumber min={5} max={10080} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dailyLimit" label="每日发送上限（条）" rules={[{ required: true }]}>
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="active" label="启用任务" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行记录 Modal */}
      <Modal
        title={`执行记录 · ${recordsModal.task?.name || ''}`}
        open={recordsModal.open}
        onCancel={() => setRecordsModal((s) => ({ ...s, open: false }))}
        footer={null}
        width={720}
      >
        <Table<AutoCommentRecord>
          rowKey="id"
          size="small"
          loading={recordsModal.loading}
          dataSource={recordsModal.records}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行记录" /> }}
          columns={[
            {
              title: '目标链接',
              dataIndex: 'targetUrl',
              ellipsis: true,
              render: (v: string | null) =>
                v ? (
                  <a href={v} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                    {v}
                  </a>
                ) : '—',
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (v: string) => {
                const meta: Record<string, { label: string; color: string }> = {
                  sent: { label: '已发送', color: 'success' },
                  failed: { label: '失败', color: 'error' },
                  processing: { label: '执行中', color: 'processing' },
                };
                const m = meta[v] || { label: v, color: 'default' };
                return <Tag color={m.color}>{m.label}</Tag>;
              },
            },
            { title: '结果说明', dataIndex: 'message', ellipsis: true },
            { title: '时间', dataIndex: 'createdAt', width: 170, render: (v: string) => new Date(v).toLocaleString() },
          ]}
        />
      </Modal>
    </PageContainer>
  );
}
