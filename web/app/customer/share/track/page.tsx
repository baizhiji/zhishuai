'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Table, Tag, message, Empty } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const { Title } = Typography;

export default function ShareTrackPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, converted: 0, rate: 0, commission: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        api.get('/share/records').catch(() => []),
        api.get('/share/stats').catch(() => ({})),
      ]);

      const recordsList = Array.isArray(recordsRes) ? recordsRes : (recordsRes?.data || []);
      const statsData = statsRes?.data || statsRes;

      setRecords(recordsList);
      setStats({
        total: statsData.total || 0,
        converted: statsData.converted || 0,
        rate: statsData.rate || (statsData.total ? Math.round((statsData.converted / statsData.total) * 100) : 0),
        commission: statsData.commission || 0,
      });
    } catch (error) {
      console.error('获取推荐追踪数据失败:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '推荐人', dataIndex: 'referrerName', key: 'referrerName', render: (v: string) => v || '-' },
    { title: '被推荐人', dataIndex: 'refereeName', key: 'refereeName', render: (v: string) => v || '-' },
    { title: '推荐码', dataIndex: 'code', key: 'code', render: (v: string) => v || '-' },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime', render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' || status === 'active' ? 'success' : 'default'}>
          {status === 'success' || status === 'active' ? '成功' : status === 'registered' ? '已注册' : '待激活'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2} className="mb-2">推荐追踪</Title>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">{stats.total}</div>
              <div className="text-gray-600 text-sm">总推荐数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">{stats.converted}</div>
              <div className="text-gray-600 text-sm">成功转化</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">{stats.rate}%</div>
              <div className="text-gray-600 text-sm">转化率</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">{stats.commission}</div>
              <div className="text-gray-600 text-sm">累计佣金</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="推荐记录">
        {records.length > 0 ? (
          <Table dataSource={records} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        ) : (
          <Empty description="暂无推荐记录" />
        )}
      </Card>
    </div>
  );
}
