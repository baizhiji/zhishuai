'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, message, Tag } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

export default function AgentSettlementPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchRecords();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/settlement/stats?agentId=${user?.id}`, {
<<<<<<< HEAD
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
=======
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());
      if (res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settlement/records?agentId=${user?.id}`, {
<<<<<<< HEAD
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
=======
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());
      if (res.data) {
        setRecords(res.data);
      }
    } catch (error) {
      console.error('获取记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (values: any) => {
    try {
      const res = await fetch('/api/settlement/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
<<<<<<< HEAD
          Authorization: `Bearer ${localStorage.getItem('token')}`
=======
          Authorization: `Bearer ${localStorage.getItem('token')}`,
>>>>>>> 962968886be726cd434c792933b5515366d34518
        },
        body: JSON.stringify({
          agentId: user?.id,
          amount: stats.pendingSettlement,
          bankAccount: values.bankAccount,
<<<<<<< HEAD
          bankName: values.bankName
        })
=======
          bankName: values.bankName,
        }),
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());
      if (res.success) {
        message.success('结算申请已提交');
        setSettleModalVisible(false);
        form.resetFields();
        fetchStats();
      }
    } catch (error) {
      message.error('申请失败');
    }
  };

  const columns = [
    { title: '结算周期', dataIndex: 'period', key: 'period' },
    { title: '客户数', dataIndex: 'customerCount', key: 'customerCount' },
<<<<<<< HEAD
    { title: '收入(元)', dataIndex: 'income', key: 'income', render: (v: number) => `¥${v?.toFixed(2) || '0.00'}` },
    { title: '分成(元)', dataIndex: 'commission', key: 'commission', render: (v: number) => `¥${v?.toFixed(2) || '0.00'}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
=======
    {
      title: '收入(元)',
      dataIndex: 'income',
      key: 'income',
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '分成(元)',
      dataIndex: 'commission',
      key: 'commission',
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
>>>>>>> 962968886be726cd434c792933b5515366d34518
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待处理' },
          approved: { color: 'blue', text: '已批准' },
          paid: { color: 'green', text: '已支付' },
<<<<<<< HEAD
          rejected: { color: 'red', text: '已拒绝' }
        };
        const item = map[status] || { color: 'default', text: status };
        return <Tag color={item.color}>{item.text}</Tag>;
      }
    },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt' }
=======
          rejected: { color: 'red', text: '已拒绝' },
        };
        const item = map[status] || { color: 'default', text: status };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt' },
>>>>>>> 962968886be726cd434c792933b5515366d34518
  ];

  return (
    <div>
<<<<<<< HEAD
      <Card title="分成结算" extra={
        <Button 
          type="primary" 
          icon={<DollarOutlined />}
          onClick={() => setSettleModalVisible(true)}
          disabled={(stats.pendingSettlement || 0) <= 0}
        >
          申请结算
        </Button>
      }>
=======
      <Card
        title="分成结算"
        extra={
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => setSettleModalVisible(true)}
            disabled={(stats.pendingSettlement || 0) <= 0}
          >
            申请结算
          </Button>
        }
      >
>>>>>>> 962968886be726cd434c792933b5515366d34518
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="累计收益" value={stats.totalRevenue || 0} prefix="¥" precision={2} />
          </Col>
          <Col span={6}>
<<<<<<< HEAD
            <Statistic title="已结算金额" value={stats.settledAmount || 0} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="待结算金额" value={stats.pendingSettlement || 0} prefix="¥" precision={2} valueStyle={{ color: '#faad14' }} />
=======
            <Statistic
              title="已结算金额"
              value={stats.settledAmount || 0}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待结算金额"
              value={stats.pendingSettlement || 0}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
>>>>>>> 962968886be726cd434c792933b5515366d34518
          </Col>
          <Col span={6}>
            <Statistic title="我的客户数" value={stats.customerCount || 0} />
          </Col>
        </Row>
      </Card>

      <Card title="结算记录" style={{ marginTop: 16 }}>
<<<<<<< HEAD
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
        />
=======
        <Table columns={columns} dataSource={records} rowKey="id" loading={loading} />
>>>>>>> 962968886be726cd434c792933b5515366d34518
      </Card>

      <Modal
        title="申请结算"
        open={settleModalVisible}
        onCancel={() => setSettleModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: '#666' }}>结算金额：</span>
          <span style={{ fontSize: 24, color: '#faad14', fontWeight: 'bold' }}>
            ¥{(stats.pendingSettlement || 0).toFixed(2)}
          </span>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSettle}>
<<<<<<< HEAD
          <Form.Item name="bankName" label="开户行" rules={[{ required: true, message: '请输入开户行名称' }]}>
            <Input placeholder="请输入开户行名称" />
          </Form.Item>
          <Form.Item name="bankAccount" label="银行账号" rules={[{ required: true, message: '请输入银行账号' }]}>
=======
          <Form.Item
            name="bankName"
            label="开户行"
            rules={[{ required: true, message: '请输入开户行名称' }]}
          >
            <Input placeholder="请输入开户行名称" />
          </Form.Item>
          <Form.Item
            name="bankAccount"
            label="银行账号"
            rules={[{ required: true, message: '请输入银行账号' }]}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            <Input placeholder="请输入银行账号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认申请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
