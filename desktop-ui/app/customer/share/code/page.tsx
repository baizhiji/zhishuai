'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space,
  Typography, Tooltip, QRCode,
} from 'antd';
import {
  PlusOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined,
  QrcodeOutlined, DownloadOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Text } = Typography;

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  douyin: { label: '抖音', color: 'black' },
  kuaishou: { label: '快手', color: 'orange' },
  xiaohongshu: { label: '小红书', color: 'red' },
  video: { label: '视频号', color: 'green' },
};

interface ShareCode {
  id: string;
  title: string;
  platforms: string[];
  videoUrl: string;
  qrContent: string;
  qrCodeImage: string;
  clicks: number;
  uniqueClicks: number;
  createdAt: string;
}

export default function ShareCodePage() {
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState<ShareCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrModalCode, setQrModalCode] = useState<ShareCode | null>(null);
  const [form] = Form.useForm();

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/share/codes');
      const rawList = (res.list as any[]) || [];
      setCodes(rawList.map((c: any) => ({
        id: c.id,
        title: c.title || '未命名',
        platforms: c.platforms || [],
        videoUrl: c.videoUrl || '',
        qrContent: c.qrContent || '',
        qrCodeImage: c.qrCodeImage || '',
        clicks: c.scanCount || 0,
        uniqueClicks: c.directReferrals || 0,
        createdAt: c.createdAt,
      })) as ShareCode[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const openCreate = () => { setEditingCode(null); form.resetFields(); setModalVisible(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { title: values.title, videoUrl: values.videoUrl, platforms: [values.platform] };
      setSubmitting(true);
      if (editingCode) {
        await apiClient.put(`/share/codes/${editingCode.id}`, payload);
        message.success('转发二维码已更新');
      } else {
        await apiClient.post('/share/codes', payload);
        message.success('转发二维码创建成功');
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
      content: '删除后该转发二维码将失效，确定继续吗？',
      okText: '确认删除', cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try { await apiClient.delete(`/share/codes/${code.id}`); message.success('已删除'); fetchCodes(); } catch { message.error('删除失败'); }
      },
    });
  };

  const handleCopyLink = (content: string) => {
    if (!content) { message.warning('短链暂不可用'); return; }
    navigator.clipboard.writeText(content).then(() => message.success('短链已复制'));
  };

  const handleDownloadQr = (code: ShareCode) => {
    if (!code.qrCodeImage) { message.warning('二维码图片暂不可用'); return; }
    const link = document.createElement('a');
    link.href = code.qrCodeImage;
    link.download = `转发二维码-${code.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('二维码已下载');
  };

  const platformLabel = (code: ShareCode) =>
    (code.platforms || []).map(p => PLATFORM_CONFIG[p]?.label || p).join('/') || '未知平台';

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 160 },
    { title: '平台', dataIndex: 'platforms', key: 'platforms', width: 110, render: (ps: string[]) => (
      <Space size={4} wrap>
        {(ps || []).map(p => {
          const cfg = PLATFORM_CONFIG[p] || { label: p, color: 'default' };
          return <Tag key={p} color={cfg.color}>{cfg.label}</Tag>;
        })}
      </Space>
    )},
    { title: '转发二维码', key: 'qr', width: 110, render: (_: unknown, r: ShareCode) =>
      r.qrContent ? (
        <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => setQrModalCode(r)}>
          <QRCode value={r.qrContent} size={56} bordered={false} />
        </div>
      ) : <Text type="secondary">-</Text>
    },
    { title: '扫码次数', dataIndex: 'clicks', key: 'clicks', width: 90, sorter: (a: ShareCode, b: ShareCode) => a.clicks - b.clicks },
    { title: '独立访客', dataIndex: 'uniqueClicks', key: 'uniqueClicks', width: 90, sorter: (a: ShareCode, b: ShareCode) => a.uniqueClicks - b.uniqueClicks },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, sorter: (a: ShareCode, b: ShareCode) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), defaultSortOrder: 'descend' as const, render: (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-' },
    { title: '操作', key: 'action', width: 170, fixed: 'right' as const, render: (_: unknown, r: ShareCode) => (
      <Space size={0}>
        <Tooltip title="查看/下载二维码"><Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => setQrModalCode(r)} /></Tooltip>
        <Tooltip title="复制短链"><Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink(r.qrContent)} /></Tooltip>
        <Tooltip title="下载二维码"><Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadQr(r)} /></Tooltip>
        <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)} /></Tooltip>
      </Space>
    )},
  ];

  return (
    <PageContainer
      title="平台转发二维码"
      description="粘贴已发布视频的转发链接，生成对应平台的转发二维码；他人用该平台App扫码即可一键转发"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '推荐分享' },
        { title: '转发二维码' },
      ]}
      loading={false}
      skeletonType="table"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCodes}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建转发二维码</Button>
        </Space>
      }
    >
      <Card>
        <Table
          columns={columns} dataSource={codes} rowKey="id" loading={loading}
          scroll={{ x: 1000 }}
          locale={{ emptyText: '暂无转发二维码，点击「创建转发二维码」开始' }}
        />
      </Card>

      <Modal
        title={editingCode ? '编辑转发二维码' : '创建转发二维码'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingCode(null); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingCode ? '保存' : '创建'} cancelText="取消" width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="视频标题" rules={[{ required: true, message: '请输入视频标题' }]}>
            <Input placeholder="例：产品介绍视频-抖音版" />
          </Form.Item>
          <Form.Item name="platform" label="内容平台" initialValue="douyin" rules={[{ required: true, message: '请选择平台' }]}>
            <Select options={Object.entries(PLATFORM_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
          </Form.Item>
          <Form.Item name="videoUrl" label="平台转发链接" rules={[{ required: true, message: '请粘贴平台的分享/转发链接' }]}>
            <Input placeholder="粘贴对应平台的分享链接，如 https://v.douyin.com/xxxx/" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="转发二维码"
        open={qrModalCode !== null}
        onCancel={() => setQrModalCode(null)}
        footer={null}
        width={400}
      >
        {qrModalCode && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <QRCode value={qrModalCode.qrContent} size={220} />
            <p style={{ marginTop: 16, color: '#64748b' }}>
              用<span style={{ color: '#6D28D9', fontWeight: 600 }}>{platformLabel(qrModalCode)}</span>App扫码，直达视频一键转发
            </p>
            <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>{qrModalCode.qrContent}</Text>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadQr(qrModalCode)}>下载二维码</Button>
              <Button icon={<CopyOutlined />} onClick={() => handleCopyLink(qrModalCode.qrContent)}>复制短链</Button>
            </Space>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
