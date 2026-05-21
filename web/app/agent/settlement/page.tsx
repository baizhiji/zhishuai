'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, message, Tag, Alert } from 'antd';
import { DollarOutlined, TeamOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

export default function AgentSettlementPage() {
  const { user } = useAuth();
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.id) {
      fetchAgentInfo();
      fetchStats();
      fetchRecords();
    }
  }, [user]);

  // 获取代理商信息
  const fetchAgentInfo = async () => {
    try {
      const res = await fetch(`/api/agents/${(user as any)?.agentId || user?.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json());
      if (res.data) {
        setAgentInfo(res.data);
      }
    } catch (error) {
      console.error('获取代理商信息失败:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/settlement/stats?agentId=${(user as any)?.agentId || user?.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
      const res = await fetch(`/api/settlement/records?agentId=${(user as any)?.agentId || user?.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          agentId: (user as any)?.agentId || user?.id,
          amount: stats.pendingSettlement,
          bankAccount: values.bankAccount,
          bankName: values.bankName
        })
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
    { title: '结算周期', dataIndex: 'date', key: 'date' },
    { title: '客户数', dataIndex: 'customerCount', key: 'customerCount' },
    { title: '收入(元)', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toFixed(2)}` },
    { 
      title: '分成(元)', 
      dataIndex: 'commission', 
      key: 'commission', 
      render: (v: number) => `¥${v.toFixed(2)}` 
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'settled' ? 'green' : 'orange'}>
          {status === 'settled' ? '已结算' : '待结算'}
        </Tag>
      )
    }
  ];

  // 判断代理商类型
  const isOneTimePayment = agentInfo?.subscriptionType === 'one_time';
  const commissionRate = agentInfo?.commissionRate || 0;
  const fixedAmount = agentInfo?.fixedCommission || 0;

  return (
    <div style={{ padding: 24 }}>
      <Card title="分成结算">
        {isOneTimePayment ? (
          <Alert
            message="一次性付费代理商"
            description={`您是按固定金额（¥${fixedAmount.toFixed(2)}）一次性付费的代理商，所有客户收入归您所有。`}
            type="info"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 24 }}
          />
        ) : (
          <Alert
            message={`按比例分成代理商（${commissionRate}%）`}
            description={`您按${commissionRate}%的比例从客户的支付金额中获得分成。`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="我的客户总数" value={stats.totalCustomers || 0} prefix={<TeamOutlined />} />
          </Col>
          {isOneTimePayment ? (
            <>
              <Col span={6}>
                <Statistic title="累计收入" value={stats.totalRevenue || 0} prefix="¥" precision={2} />
              </Col>
              <Col span={6}>
                <Statistic title="当月收入" value={stats.monthlyRevenue || 0} prefix="¥" precision={2} />
              </Col>
              <Col span={6}>
                <Statistic title="付费金额" value={fixedAmount} prefix="¥" precision={2} valueStyle={{ color: '#1890ff' }} />
              </Col>
            </>
          ) : (
            <>
              <Col span={6}>
                <Statistic title="分成比例" value={`${commissionRate}%`} prefix={<CreditCardOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="累计分成" value={stats.totalCommission || 0} prefix="¥" precision={2} />
              </Col>
              <Col span={6}>
                <Statistic title="待结算" value={stats.pendingSettlement || 0} prefix="¥" precision={2} valueStyle={{ color: '#faad14' }} />
              </Col>
            </>
          )}
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="本月新增客户" value={stats.monthlyCustomers || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="本月收入" value={stats.monthlyRevenue || 0} prefix="¥" precision={2} />
          </Col>
          {!isOneTimePayment && (
            <>
              <Col span={6}>
                <Statistic title="本月分成" value={stats.monthlyCommission || 0} prefix="¥" precision={2} />
              </Col>
              <Col span={6}>
                <Statistic title="已结算金额" value={stats.settledAmount || 0} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} />
              </Col>
            </>
          )}
        </Row>

        {!isOneTimePayment && (
          <Button 
            type="primary" 
            icon={<DollarOutlined />}
            onClick={() => setSettleModalVisible(true)}
            disabled={(stats.pendingSettlement || 0) <= 0}
          >
            申请结算
          </Button>
        )}
      </Card>

      {!isOneTimePayment && (
        <Card title="结算记录" style={{ marginTop: 16 }}>
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            loading={loading}
          />
        </Card>
      )}

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
          <Form.Item name="bankName" label="开户行" rules={[{ required: true, message: '请输入开户行' }]}>
            <Input placeholder="请输入开户行名称" />
          </Form.Item>
          <Form.Item name="bankAccount" label="银行账号" rules={[{ required: true, message: '请输入银行账号' }]}>
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
}          <Col span={6}>
            <Statistic title="已结算金额" value={stats.settledAmount || 0} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} />
          </Col>
        </Row>

        <Button 
          type="primary" 
          icon={<DollarOutlined />}
          onClick={() => setSettleModalVisible(true)}
          disabled={(stats.pendingSettlement || 0) <= 0}
        >
          申请结算
        </Button>
      </Card>

      <Card title="结算记录" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
        />
      </Card>
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
          <Form.Item name="bankName" label="开户行" rules={[{ required: true, message: '请输入开户行' }]}>
            <Input placeholder="请输入开户行名称" />
          </Form.Item>
          <Form.Item name="bankAccount" label="银行账号" rules={[{ required: true, message: '请输入银行账号' }]}>
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
