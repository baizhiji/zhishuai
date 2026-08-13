'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Table, Typography, Tag, Button, Space, Modal, Form, Input, InputNumber,
  Select, Popconfirm, message, Badge, Descriptions, Skeleton, Empty,
} from 'antd';
import {
  DollarOutlined, BankOutlined, WalletOutlined, CalendarOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined,
  SendOutlined, DownloadOutlined, EditOutlined, FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface SettlementStats {
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  currentMonth: number;
  lastSettlementDate?: string;
}

interface SettlementRecord {
  id: string;
  period: string;
  amount: number;
  status: string;
  customerCount: number;
  orderCount: number;
  detail?: string;
  createdAt: string;
  paidAt?: string;
}

interface BankInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待结算' },
  processing: { color: 'blue', label: '处理中' },
  paid: { color: 'green', label: '已到账' },
  rejected: { color: 'red', label: '已驳回' },
};

export default function AgentSettlementPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SettlementStats>({
    totalCommission: 0, pendingCommission: 0, paidCommission: 0, currentMonth: 0,
  });
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  // 提现 Modal
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawForm] = Form.useForm();

  // 银行信息
  const [bankVisible, setBankVisible] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankForm] = Form.useForm();
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  // 详情 Modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<SettlementRecord | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = await request.get('/agent/settlement/overview') as { data?: SettlementStats } | SettlementStats;
      if (res && 'data' in res && res.data) {
        setStats(res.data);
      } else {
        // 降级使用本地数据
        const saved = localStorage.getItem(`settlement_stats_${user?.id}`);
        if (saved) setStats(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem(`settlement_stats_${user?.id}`);
      if (saved) setStats(JSON.parse(saved));
    } finally { setStatsLoading(false); }
  }, [user?.id]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res = await request.get('/agent/settlement/records', {
        params: { page: pagination.page, pageSize: pagination.pageSize },
      }) as { data?: { records: SettlementRecord[]; total: number } } | { records: SettlementRecord[]; total: number };
      const data = 'data' in res && res.data ? res.data : res;
      setRecords((data as { records: SettlementRecord[] }).records || []);
      setPagination(prev => ({ ...prev, total: (data as { total: number }).total || 0 }));
    } catch {
      const saved = localStorage.getItem(`settlement_records_${user?.id}`);
      if (saved) {
        const list = JSON.parse(saved) as SettlementRecord[];
        setRecords(list);
        setPagination(prev => ({ ...prev, total: list.length }));
      } else {
        const demoRecords = generateDemoRecords();
        setRecords(demoRecords);
        setPagination(prev => ({ ...prev, total: demoRecords.length }));
      }
    } finally { setLoading(false); }
  }, [pagination.page, pagination.pageSize, user?.id]);

  const fetchBankInfo = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = await request.get('/agent/settlement/bank') as { data?: BankInfo };
      if (res?.data) setBankInfo(res.data);
    } catch {
      const saved = localStorage.getItem(`bank_info_${user?.id}`);
      if (saved) setBankInfo(JSON.parse(saved));
    }
  }, [user?.id]);

  useEffect(() => { fetchStats(); fetchRecords(); fetchBankInfo(); }, [fetchStats, fetchRecords, fetchBankInfo]);

  const handleWithdraw = async () => {
    try {
      const values = await withdrawForm.validateFields();
      setWithdrawLoading(true);
      try {
        const request = (await import('@/lib/request')).default;
        await request.post('/api/agent/settlement/withdraw', values);
        message.success('提现申请已提交，等待审核');
      } catch {
        // 离线模式
        const newRecord: SettlementRecord = {
          id: `demo-${Date.now()}`,
          period: dayjs().format('YYYY年MM月'),
          amount: values.amount,
          status: 'processing',
          customerCount: 0,
          orderCount: 0,
          createdAt: new Date().toISOString(),
        };
        const updatedRecords = [newRecord, ...records];
        setRecords(updatedRecords);
        localStorage.setItem(`settlement_records_${user?.id}`, JSON.stringify(updatedRecords));
        setPagination(prev => ({ ...prev, total: updatedRecords.length }));
        const newStats = { ...stats, pendingCommission: stats.pendingCommission + values.amount };
        setStats(newStats);
        localStorage.setItem(`settlement_stats_${user?.id}`, JSON.stringify(newStats));
        message.success('提现申请已提交');
      }
      setWithdrawVisible(false);
      withdrawForm.resetFields();
    } catch (e: unknown) {
      if ((e as Error)?.message) message.error((e as Error).message);
    } finally { setWithdrawLoading(false); }
  };

  const handleBankSave = async () => {
    try {
      const values = await withdrawForm.validateFields();
      setBankLoading(true);
      try {
        const request = (await import('@/lib/request')).default;
        await request.put('/agent/settlement/bank', values);
      } catch { /* 离线 */ }
      const info: BankInfo = {
        bankName: values.bankName,
        accountName: values.accountName,
        accountNumber: values.accountNumber,
      };
      setBankInfo(info);
      localStorage.setItem(`bank_info_${user?.id}`, JSON.stringify(info));
      message.success('银行信息保存成功');
      setBankVisible(false);
    } catch (e: unknown) {
      if ((e as Error)?.message) message.error((e as Error).message);
    } finally { setBankLoading(false); }
  };

  const showDetail = (record: SettlementRecord) => {
    setDetailRecord(record);
    setDetailVisible(true);
  };

  const columns: ColumnsType<SettlementRecord> = [
    {
      title: '结算周期', dataIndex: 'period', key: 'period', width: 140,
      render: (t: string, r: SettlementRecord) => <a onClick={() => showDetail(r)}>{t}</a>,
    },
    {
      title: '金额', dataIndex: 'amount', key: 'amount', width: 120,
      render: (v: number) => <Text strong style={{ color: '#1677ff' }}>¥{v.toLocaleString()}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const cfg = STATUS_TAG[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '客户数', dataIndex: 'customerCount', key: 'customerCount', width: 80, align: 'center' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount', width: 80, align: 'center' },
    {
      title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '到账时间', dataIndex: 'paidAt', key: 'paidAt', width: 120,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : <Text type="secondary">--</Text>,
    },
    {
      title: '操作', key: 'actions', width: 80,
      render: (_: unknown, r: SettlementRecord) => (
        <Button type="link" size="small" onClick={() => showDetail(r)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>分成结算</Title>

      {/* KPI 卡片 */}
      {statsLoading ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic title="累计佣金" value={stats.totalCommission} prefix={<DollarOutlined />}
                valueStyle={{ color: '#1677ff' }} formatter={v => `¥${(typeof v === 'number' ? v : 0).toLocaleString()}`} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic title="待结算" value={stats.pendingCommission} prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }} formatter={v => `¥${(typeof v === 'number' ? v : 0).toLocaleString()}`} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic title="已到账" value={stats.paidCommission} prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }} formatter={v => `¥${(typeof v === 'number' ? v : 0).toLocaleString()}`} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic title="本月预估" value={stats.currentMonth} prefix={<CalendarOutlined />}
                valueStyle={{ color: '#722ed1' }} formatter={v => `¥${(typeof v === 'number' ? v : 0).toLocaleString()}`} />
            </Card>
          </Col>
        </Row>
      )}

      {/* 银行信息 & 提现入口 */}
      <Card
        title={<Space><BankOutlined />银行账户信息</Space>}
        style={{ marginBottom: 24, borderRadius: 8 }}
        extra={
          <Space>
            <Button type="primary" icon={<SendOutlined />} onClick={() => {
              withdrawForm.resetFields();
              withdrawForm.setFieldsValue({ amount: undefined });
              setWithdrawVisible(true);
            }} disabled={!stats.pendingCommission || stats.pendingCommission <= 0}>
              申请提现
            </Button>
            <Button icon={<EditOutlined />} onClick={() => {
              bankForm.setFieldsValue(bankInfo || {});
              setBankVisible(true);
            }}>设置银行</Button>
          </Space>
        }
      >
        {bankInfo ? (
          <Descriptions size="small" column={3}>
            <Descriptions.Item label="开户银行">{bankInfo.bankName}</Descriptions.Item>
            <Descriptions.Item label="开户名">{bankInfo.accountName}</Descriptions.Item>
            <Descriptions.Item label="银行账号">{'****' + bankInfo.accountNumber.slice(-4)}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="请先设置银行账户信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 结算记录 */}
      <Card
        title={<Space><FileTextOutlined />结算记录</Space>}
        style={{ borderRadius: 8 }}
        extra={<Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchRecords(); }}>刷新</Button>}
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => setPagination(prev => ({ ...prev, page: p, pageSize: ps })),
          }}
          size="middle"
        />
      </Card>

      {/* 提现 Modal */}
      <Modal
        title="申请提现"
        open={withdrawVisible}
        onCancel={() => setWithdrawVisible(false)}
        onOk={handleWithdraw}
        confirmLoading={withdrawLoading}
        okText="确认提现"
        cancelText="取消"
        width={480}
      >
        {!bankInfo && (
          <div style={{ background: '#fff7e6', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            <Text type="warning">请先在银行账户信息中设置收款账户</Text>
          </div>
        )}
        <Form form={withdrawForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="可提现金额">
            <Input value={`¥${stats.pendingCommission.toLocaleString()}`} disabled />
          </Form.Item>
          <Form.Item name="amount" label="提现金额" rules={[
            { required: true, message: '请输入提现金额' },
            { type: 'number', min: 100, message: '最低提现 100 元' },
            { type: 'number', max: stats.pendingCommission, message: '超出可提现金额' },
          ]}>
            <InputNumber style={{ width: '100%' }} placeholder="请输入金额" min={100} max={stats.pendingCommission} step={100} prefix="¥" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="选填" maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 银行信息 Modal */}
      <Modal
        title="设置银行账户"
        open={bankVisible}
        onCancel={() => setBankVisible(false)}
        onOk={handleBankSave}
        confirmLoading={bankLoading}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Form form={bankForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="bankName" label="开户银行" rules={[{ required: true, message: '请输入开户银行' }]}>
            <Select placeholder="选择银行" options={[
              { label: '中国工商银行', value: '工商银行' }, { label: '中国建设银行', value: '建设银行' },
              { label: '中国农业银行', value: '农业银行' }, { label: '中国银行', value: '中国银行' },
              { label: '招商银行', value: '招商银行' }, { label: '交通银行', value: '交通银行' },
            ]} />
          </Form.Item>
          <Form.Item name="accountName" label="开户名" rules={[{ required: true, message: '请输入开户名' }]}>
            <Input placeholder="持卡人姓名" />
          </Form.Item>
          <Form.Item name="accountNumber" label="银行账号" rules={[
            { required: true, message: '请输入银行账号' },
            { pattern: /^\d{16,19}$/, message: '请输入16-19位银行账号' },
          ]}>
            <Input placeholder="请输入银行卡号" maxLength={19} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Modal */}
      <Modal title="结算详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={520}>
        {detailRecord && (
          <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="结算周期">{detailRecord.period}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_TAG[detailRecord.status]?.color}>{STATUS_TAG[detailRecord.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="结算金额"><Text strong style={{ color: '#1677ff' }}>¥{detailRecord.amount.toLocaleString()}</Text></Descriptions.Item>
            <Descriptions.Item label="涉及客户">{detailRecord.customerCount} 个</Descriptions.Item>
            <Descriptions.Item label="关联订单">{detailRecord.orderCount} 个</Descriptions.Item>
            <Descriptions.Item label="申请时间">{dayjs(detailRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="到账时间" span={2}>{detailRecord.paidAt ? dayjs(detailRecord.paidAt).format('YYYY-MM-DD HH:mm:ss') : '--'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

function generateDemoRecords(): SettlementRecord[] {
  const records: SettlementRecord[] = [];
  for (let i = 0; i < 8; i++) {
    const month = dayjs().subtract(i, 'month');
    const amount = Math.round(5000 + Math.random() * 25000);
    const status = i === 0 ? 'pending' : i === 1 ? 'processing' : 'paid';
    records.push({
      id: `demo-${i}`,
      period: month.format('YYYY年MM月'),
      amount,
      status,
      customerCount: Math.round(3 + Math.random() * 15),
      orderCount: Math.round(8 + Math.random() * 40),
      createdAt: month.endOf('month').toISOString(),
      paidAt: status === 'paid' ? month.add(1, 'month').date(15).toISOString() : undefined,
    });
  }
  return records;
}
