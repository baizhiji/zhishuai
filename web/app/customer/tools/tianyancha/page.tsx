'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Statistic,
  Spin,
  Divider,
  Descriptions,
  message,
  Empty,
  Modal,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  TeamOutlined,
  GlobalOutlined,
  DollarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CompanyInfo {
  name: string;
  creditCode: string;
  legalPerson: string;
  registeredCapital: string;
  paidCapital: string;
  establishmentDate: string;
  businessTerm: string;
  status: string;
  registrationAuthority: string;
  address: string;
  businessScope: string;
  phone?: string;
  email?: string;
  website?: string;
  shareholders: Shareholder[];
  branches: Branch[];
  changeRecords: ChangeRecord[];
}

interface Shareholder {
  name: string;
  capital: string;
  ratio: string;
}

interface Branch {
  name: string;
  creditCode: string;
  status: string;
}

interface ChangeRecord {
  date: string;
  item: string;
  before: string;
  after: string;
}

interface SearchHistory {
  keyword: string;
  time: string;
  result?: string;
}

export default function TianyanchaPage() {
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'name' | 'credit'>('name');
  const [keyword, setKeyword] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      const res = await request.post('/tools/tianyancha/search', {
        keyword: keyword.trim(),
        type: searchType,
      });

      if (res.success || res.code === 0) {
        setCompanyInfo(res.data);
        // 添加搜索历史
        setHistory(prev => [{
          keyword: keyword.trim(),
          time: new Date().toLocaleString(),
          result: res.data?.name || '未找到',
        }, ...prev.slice(0, 9)]);
        message.success('查询成功');
      } else {
        message.error('查询失败，请检查天眼查 API 配置');
      }
    } catch (error) {
      console.error('查询失败:', error);
      message.error('查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '关键词', dataIndex: 'keyword', key: 'keyword' },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '结果', dataIndex: 'result', key: 'result' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SafetyCertificateOutlined style={{ color: '#722ED1' }} /> 天眼查 - 企业信息查询
        </Title>
        <Text type="secondary">快速查询企业工商信息、股东信息、经营状况等</Text>
      </div>

      <Row gutter={24}>
        {/* 左侧搜索区域 */}
        <Col span={16}>
          <Card>
            {/* 搜索方式 */}
            <Form layout="vertical">
              <Form.Item label="搜索方式">
                <Select
                  value={searchType}
                  onChange={setSearchType}
                  style={{ width: 200 }}
                >
                  <Select.Option value="name">按企业名称</Select.Option>
                  <Select.Option value="credit">按统一社会信用代码</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="搜索关键词">
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder={searchType === 'name' ? '请输入企业名称' : '请输入统一社会信用代码'}
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                    size="large"
                    style={{ flex: 1 }}
                  />
                  <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                    查询
                  </Button>
                </Space.Compact>
              </Form.Item>
            </Form>

            <Alert
              message="温馨提示"
              description="支持查询企业工商信息、股东信息、经营范围、变更记录等。请确保查询目的合法合规。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>

          {/* 查询结果 */}
          {loading ? (
            <Card style={{ marginTop: 24, textAlign: 'center', padding: 60 }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              <Paragraph style={{ marginTop: 16 }}>正在查询中...</Paragraph>
            </Card>
          ) : companyInfo ? (
            <Card style={{ marginTop: 24 }} title="查询结果">
              {/* 基本信息 */}
              <div style={{ marginBottom: 24 }}>
                <Title level={5}><BankOutlined /> 基本信息</Title>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="企业名称" span={2}>
                    <Text strong>{companyInfo.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="统一社会信用代码">
                    {companyInfo.creditCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="企业状态">
                    <Tag color="success">{companyInfo.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="法定代表人">
                    {companyInfo.legalPerson}
                  </Descriptions.Item>
                  <Descriptions.Item label="注册资本">
                    {companyInfo.registeredCapital}
                  </Descriptions.Item>
                  <Descriptions.Item label="实缴资本">
                    {companyInfo.paidCapital}
                  </Descriptions.Item>
                  <Descriptions.Item label="成立日期">
                    {companyInfo.establishmentDate}
                  </Descriptions.Item>
                  <Descriptions.Item label="营业期限">
                    {companyInfo.businessTerm}
                  </Descriptions.Item>
                  <Descriptions.Item label="登记机关">
                    {companyInfo.registrationAuthority}
                  </Descriptions.Item>
                  <Descriptions.Item label="企业地址" span={2}>
                    <Space><EnvironmentOutlined />{companyInfo.address}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="经营范围" span={2}>
                    {companyInfo.businessScope}
                  </Descriptions.Item>
                  {companyInfo.phone && (
                    <Descriptions.Item label="联系电话">
                      <Space><PhoneOutlined />{companyInfo.phone}</Space>
                    </Descriptions.Item>
                  )}
                  {companyInfo.email && (
                    <Descriptions.Item label="电子邮箱">
                      <Space><MailOutlined />{companyInfo.email}</Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>

              {/* 股东信息 */}
              {companyInfo.shareholders.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={5}><TeamOutlined /> 股东信息</Title>
                  <Table
                    dataSource={companyInfo.shareholders}
                    rowKey="name"
                    pagination={false}
                    columns={[
                      { title: '股东', dataIndex: 'name', key: 'name' },
                      { title: '认缴出资额', dataIndex: 'capital', key: 'capital' },
                      { title: '持股比例', dataIndex: 'ratio', key: 'ratio' },
                    ]}
                  />
                </div>
              )}

              {/* 分支机构 */}
              {companyInfo.branches.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={5}><GlobalOutlined /> 分支机构</Title>
                  <Table
                    dataSource={companyInfo.branches}
                    rowKey="name"
                    pagination={false}
                    columns={[
                      { title: '分支机构名称', dataIndex: 'name', key: 'name' },
                      { title: '统一社会信用代码', dataIndex: 'creditCode', key: 'creditCode' },
                      { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="success">{s}</Tag> },
                    ]}
                  />
                </div>
              )}

              {/* 变更记录 */}
              {companyInfo.changeRecords.length > 0 && (
                <div>
                  <Title level={5}><CalendarOutlined /> 变更记录</Title>
                  <Table
                    dataSource={companyInfo.changeRecords}
                    rowKey="date"
                    pagination={false}
                    columns={[
                      { title: '变更日期', dataIndex: 'date', key: 'date', width: 120 },
                      { title: '变更事项', dataIndex: 'item', key: 'item', width: 120 },
                      { title: '变更前', dataIndex: 'before', key: 'before' },
                      { title: '变更后', dataIndex: 'after', key: 'after' },
                    ]}
                  />
                </div>
              )}

              <Divider />

              <Space>
                <Button type="primary" icon={<ShareAltOutlined />} onClick={() => setDetailVisible(true)}>
                  查看更多详情
                </Button>
                <Button onClick={() => setCompanyInfo(null)}>
                  清除结果
                </Button>
              </Space>
            </Card>
          ) : (
            <Card style={{ marginTop: 24 }}>
              <Empty description="请输入关键词开始查询" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          )}
        </Col>

        {/* 右侧统计和历史 */}
        <Col span={8}>
          {/* 统计卡片 */}
          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>查询统计</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="今日查询" value={history.filter(h => new Date(h.time).toDateString() === new Date().toDateString()).length} />
              </Col>
              <Col span={12}>
                <Statistic title="累计查询" value={history.length} />
              </Col>
            </Row>
          </Card>

          {/* 搜索历史 */}
          <Card title="搜索历史">
            {history.length === 0 ? (
              <Empty description="暂无搜索记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={history}
                rowKey="time"
                pagination={false}
                size="small"
                columns={[
                  { title: '关键词', dataIndex: 'keyword', key: 'keyword', ellipsis: true },
                  { title: '结果', dataIndex: 'result', key: 'result', ellipsis: true },
                ]}
                onRow={(record) => ({
                  onClick: () => {
                    setKeyword(record.keyword);
                    handleSearch();
                  },
                  style: { cursor: 'pointer' },
                })}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 详情弹窗 */}
      <Modal
        title="企业详情报告"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {companyInfo && (
          <div>
            <Alert
              message="完整企业报告"
              description="包含更详细的法律诉讼、知识产权、经营状况等信息。如需完整报告，请联系客服。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="企业名称" span={2}>{companyInfo.name}</Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">{companyInfo.creditCode}</Descriptions.Item>
              <Descriptions.Item label="法定代表人">{companyInfo.legalPerson}</Descriptions.Item>
              <Descriptions.Item label="注册资本">{companyInfo.registeredCapital}</Descriptions.Item>
              <Descriptions.Item label="成立日期">{companyInfo.establishmentDate}</Descriptions.Item>
              <Descriptions.Item label="企业地址" span={2}>{companyInfo.address}</Descriptions.Item>
              <Descriptions.Item label="经营范围" span={2}>{companyInfo.businessScope}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
