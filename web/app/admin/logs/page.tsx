'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Input, Select, DatePicker, Space, Tag, Row, Col, Statistic } from 'antd';
import { SearchOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getLogs, getLogStats, type AdminLog, type LogStats } from '@/services/admin-logs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [filters, setFilters] = useState({
    keyword: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  const loadLogs = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await getLogs({
        page,
        pageSize,
        ...filters,
      });
      setLogs(res.data || []);
      setPagination({ total: res.total || 0, page, pageSize });
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getLogStats(7);
      setStats(res);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = () => {
    loadLogs(1, pagination.pageSize);
    loadStats();
  };

  const getActionColor = (action: string) => {
    if (action.includes('登录') || action.includes('logout')) return 'blue';
    if (action.includes('创建') || action.includes('create')) return 'green';
    if (action.includes('更新') || action.includes('update')) return 'orange';
    if (action.includes('删除') || action.includes('delete')) return 'red';
    if (action.includes('冻结') || action.includes('disable')) return 'purple';
    return 'default';
  };

  const columns: ColumnsType<AdminLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '操作人',
      key: 'operator',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.userName || record.user?.name || '未知'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.user?.phone || ''}</div>
        </div>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (a: string) => <Tag color={getActionColor(a)}>{a}</Tag>,
    },
    { title: '操作对象', dataIndex: 'target', key: 'target', ellipsis: true },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="总操作日志"
              value={stats?.totalLogs || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="今日操作"
              value={stats?.todayLogs || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="操作日志">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索关键词"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 150 }}
            allowClear
            value={filters.action || undefined}
            onChange={v => setFilters({ ...filters, action: v || '' })}
          >
            <Option value="登录">登录</Option>
            <Option value="登出">登出</Option>
            <Option value="创建">创建</Option>
            <Option value="更新">更新</Option>
            <Option value="删除">删除</Option>
            <Option value="冻结">冻结</Option>
            <Option value="启用">启用</Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              setFilters({
                ...filters,
                startDate: dates?.[0]?.format('YYYY-MM-DD') || '',
                endDate: dates?.[1]?.format('YYYY-MM-DD') || '',
              });
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            total: pagination.total,
            current: pagination.page,
            pageSize: pagination.pageSize,
            onChange: (page, pageSize) => loadLogs(page, pageSize),
          }}
        />
      </Card>
    </div>
  );
}
