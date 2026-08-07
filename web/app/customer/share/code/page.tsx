'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space,
  Typography, Tooltip,
} from 'antd';
import {
  PlusOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined, LinkOutlined,
  QrcodeOutlined, DownloadOutlined, EyeOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Text } = Typography;
const { TextArea } = Input;

const SHARE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  permanent: { label: '永久链接', color: 'green' },
  temporary: { label: '临时链接', color: 'orange' },
  qrcode: { label: '二维码', color: 'blue' },
};

interface ShareCode {
  id: string;
  code: string;
  type: string;
  title: string;
  description: string;
  targetUrl: string;
  clicks: number;
  uniqueClicks: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function ShareCodePage() {
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState<ShareCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/api/share/codes');
      const rawList = (res.list as any[]) || [];
      setCodes(rawList.map((c: any) => ({
        id: c.id,
        code: c.id?.slice(0, 8) || '',
        type: 'qrcode',
        title: c.title || '未命名',
        description: c.videoUrl || '',
        targetUrl: c.videoUrl || '',
        clicks: c.scanCount || 0,
        uniqueClicks: c.directReferrals || 0,
        status: 'active',
        expiresAt: null,
        createdAt: c.createdAt,
      })) as ShareCode[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const openCreate = () => { setEditingCode(null); form.resetFields(); setModalVisible(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingCode) {
        await apiClient.put(`/api/share/codes/${editingCode.id}`, values);
        message.success('分享码已更新');
      } else {
        await apiClient.post('/api/share/codes', values);
        message.success('分享码创建成功');
      }
      setModalVisible(false); form.resetFields(); setEditingCode(null);
      fetchCodes();
    } catch (error: unknown) {
      if ((error as Error)?.message) message.error((error as Error).message);
    } finally { setSubmitting(false); }
  };

  const handleDelete = (code: ShareCode) => {
    Modal.confirm({
      title: `确认删除 "${code.title}"？`,
      content: '删除后该分享链接将失效，确定继续吗？',
      okText: '确认删除', cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try { await apiClient.delete(`/api/share/codes/${code.id}`); message.success('已删除'); fetchCodes(); } catch { message.error('删除失败'); }
      },
    });
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(url).then(() => message.success('链接已复制'));
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 160 },
    { title: '分享码', dataIndex: 'code', key: 'code', width: 130, render: (c: string) => <Text code>{c}</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90, render: (t: string) => {
      const cfg = SHARE_TYPE_CONFIG[t] || { label: t, color: 'default' };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: '点击量', dataIndex: 'clicks', key: 'clicks', width: 90, sorter: (a: ShareCode, b: ShareCode) => a.clicks - b.clicks },
    { title: '独立访客', dataIndex: 'uniqueClicks', key: 'uniqueClicks', width: 90, sorter: (a: ShareCode, b: ShareCode) => a.uniqueClicks - b.uniqueClicks },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '启用' : '停用'}</Tag> },
    { title: '过期时间', dataIndex: 'expiresAt', key: 'expiresAt', width: 150, render: (d: string | null) => d ? new Date(d).toLocaleString('zh-CN') : '永不过期' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, sorter: (a: ShareCode, b: ShareCode) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), defaultSortOrder: 'descend' as const, render: (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-' },
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const, render: (_: unknown, r: ShareCode) => (
      <Space size={0}>
        <Tooltip title="复制链接"><Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink(r.code)} /></Tooltip>
        <Tooltip title="预览"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(`/s/${r.code}`, '_blank')} /></Tooltip>
        <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)} /></Tooltip>
      </Space>
    )},
  ];

  return (
    <PageContainer
      title="分享码管理"
      description="创建和管理分享链接/二维码，追踪分享效果"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '分享裂变' },
        { title: '分享码' },
      ]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCodes}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建分享码</Button>
        </Space>
      }
    >
      <Card>
        <Table
          columns={columns} dataSource={codes} rowKey="id" loading={loading}
          scroll={{ x: 1100 }}
          locale={{ emptyText: '暂无分享码，点击「创建分享码」开始' }}
        />
      </Card>

      <Modal
        title={editingCode ? '编辑分享码' : '创建分享码'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingCode(null); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingCode ? '保存' : '创建'} cancelText="取消" width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例：618促销活动" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea placeholder="对外展示的链接描述" rows={2} />
          </Form.Item>
          <Form.Item name="targetUrl" label="目标URL" rules={[{ required: true, message: '请输入目标URL' }]}>
            <Input placeholder="https://your-site.com/page" />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="permanent">
            <Select
              options={Object.entries(SHARE_TYPE_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
