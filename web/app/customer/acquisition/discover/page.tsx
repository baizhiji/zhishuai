'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space, Typography,
} from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Text } = Typography;
const { TextArea } = Input;

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: '新线索', color: 'blue' },
  contacted: { label: '已联系', color: 'cyan' },
  qualified: { label: '已确认', color: 'green' },
  converted: { label: '已转化', color: 'gold' },
  invalid: { label: '无效', color: 'default' },
};

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  aiScore: number | null;
  aiQuality: string;
  notes?: string;
  createdAt: string;
  task?: { title: string };
}

export default function AcquisitionDiscoverPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [followupVisible, setFollowupVisible] = useState(false);
  const [followupForm] = Form.useForm();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res: Record<string, unknown> = await apiClient.get('/acquisition/leads', {
        params: { page: pagination.page, pageSize: pagination.pageSize, search: searchText || undefined, status: statusFilter },
      });
      setLeads((res.leads as Lead[]) || []);
      setPagination(prev => ({ ...prev, total: (res.total as number) || 0 }));
    } catch (error: unknown) {
      message.error((error as Error).message || '获取潜客列表失败');
    } finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, searchText, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openDetail = async (lead: Lead) => {
    try {
      const res: Record<string, unknown> = await apiClient.get(`/api/acquisition/leads/${lead.id}`);
      setSelectedLead(res as Lead);
    } catch { setSelectedLead(lead); }
    setDetailVisible(true);
  };

  const openEdit = (lead: Lead) => { setSelectedLead(lead); editForm.setFieldsValue(lead); setEditVisible(true); };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      await apiClient.put(`/acquisition/leads/${selectedLead!.id}`, values);
      message.success('潜客更新成功'); setEditVisible(false); fetchLeads();
    } catch (error: unknown) { if ((error as Error)?.message) message.error((error as Error).message); }
  };

  const handleDelete = (lead: Lead) => {
    Modal.confirm({
      title: '确认删除该潜客？', content: '删除后无法恢复，确定继续吗？',
      okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true },
      onOk: async () => {
        try { await apiClient.delete(`/acquisition/leads/${lead.id}`); message.success('潜客已删除'); fetchLeads(); } catch (e: unknown) { message.error((e as Error).message || '删除失败'); }
      },
    });
  };

  const openFollowup = (lead: Lead) => { setSelectedLead(lead); followupForm.resetFields(); setFollowupVisible(true); };

  const handleFollowupSubmit = async () => {
    try {
      const values = await followupForm.validateFields();
      await apiClient.post(`/acquisition/leads/${selectedLead!.id}/followups`, values);
      message.success('跟进记录已添加'); setFollowupVisible(false); fetchLeads();
    } catch (error: unknown) { if ((error as Error)?.message) message.error((error as Error).message); }
  };

  const filteredLeads = leads.filter(l => {
    if (searchText && !l.name?.includes(searchText) && !l.phone?.includes(searchText)) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '来源', dataIndex: 'source', key: 'source', width: 90, render: (s: string) => s || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => {
      const cfg = LEAD_STATUS_CONFIG[s] || { label: s, color: 'default' };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: 'AI评分', dataIndex: 'aiScore', key: 'aiScore', width: 90, sorter: (a: Lead, b: Lead) => (a.aiScore || 0) - (b.aiScore || 0), render: (v: number | null) => v != null ? <Text style={{ color: v >= 80 ? '#52c41a' : v >= 50 ? '#fa8c16' : '#f5222d', fontWeight: 600 }}>{v}</Text> : '-' },
    { title: 'AI质量', dataIndex: 'aiQuality', key: 'aiQuality', width: 90, render: (q: string) => q ? <Tag color="purple">{q}</Tag> : '-' },
    { title: '关联任务', dataIndex: ['task', 'title'], key: 'task', width: 130, render: (t: string) => t || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, sorter: (a: Lead, b: Lead) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), defaultSortOrder: 'descend' as const, render: (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-' },
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const, render: (_: unknown, r: Lead) => (
      <Space size={0}>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
        <Button type="link" size="small" onClick={() => openFollowup(r)}>跟进</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>删除</Button>
      </Space>
    )},
  ];

  return (
    <PageContainer
      title="潜客发现"
      description="发现和管理潜在客户线索，追踪转化进度"
      breadcrumb={[
        { title: '首页', href: '/customer/dashboard' },
        { title: '获客管理' },
        { title: '潜客发现' },
      ]}
      loading={false}
      skeletonType="table"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchLeads}>刷新</Button>
      }
    >
      {/* 搜索筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索姓名或手机号"
            allowClear
            style={{ width: 240 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onSearch={() => fetchLeads()}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={val => { setStatusFilter(val); }}
          >
            {Object.entries(LEAD_STATUS_CONFIG).map(([k, v]) => (
              <Select.Option key={k} value={k}>{v.label}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchLeads}>查询</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns} dataSource={filteredLeads} rowKey="id" loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: pagination.page, pageSize: pagination.pageSize, total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <Modal title="潜客详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={640}>
        {selectedLead && (
          <div>
            <h3>{selectedLead.name || '未命名'}</h3>
            <Space wrap style={{ marginBottom: 12 }}>
              {selectedLead.phone && <Tag>{selectedLead.phone}</Tag>}
              {selectedLead.email && <Tag>{selectedLead.email}</Tag>}
              {selectedLead.source && <Tag color="blue">{selectedLead.source}</Tag>}
              {selectedLead.status && <Tag color={LEAD_STATUS_CONFIG[selectedLead.status]?.color}>{LEAD_STATUS_CONFIG[selectedLead.status]?.label}</Tag>}
              {selectedLead.aiQuality && <Tag color="purple">AI质量: {selectedLead.aiQuality}</Tag>}
            </Space>
            {selectedLead.task?.title && <p style={{ color: '#666' }}>关联任务：{selectedLead.task.title}</p>}
          </div>
        )}
      </Modal>

      <Modal title="编辑潜客" open={editVisible} onCancel={() => setEditVisible(false)} onOk={handleEditSubmit} okText="保存" cancelText="取消">
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="姓名"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="status" label="状态">
            <Select>{Object.entries(LEAD_STATUS_CONFIG).map(([k, v]) => <Select.Option key={k} value={k}>{v.label}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="notes" label="备注"><TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="添加跟进记录" open={followupVisible} onCancel={() => setFollowupVisible(false)} onOk={handleFollowupSubmit} okText="提交" cancelText="取消">
        <Form form={followupForm} layout="vertical">
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <TextArea rows={4} placeholder="记录本次跟进的内容和结果" />
          </Form.Item>
          <Form.Item name="nextDate" label="下次跟进日期"><Input type="date" /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
