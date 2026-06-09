'use client';

import React, { useState } from 'react';
import { Card, Table, Button, Space, Select, DatePicker, message, Tag, Statistic, Row, Col, Modal, Form, Input } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined, DatabaseOutlined, ShoppingOutlined, TeamOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { exportCustomers, exportAcquisitionData, exportPublishRecords, exportStatistics } from '@/services/export';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportType, setExportType] = useState<'customers' | 'acquisition' | 'publish' | 'statistics'>('customers');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [form] = Form.useForm();

  // 导出数据
  const handleExport = async () => {
    setLoading(true);
    try {
      const params = { format: exportFormat };

      let response: any;
      switch (exportType) {
        case 'customers':
          response = await exportCustomers(params);
          break;
        case 'acquisition':
          response = await exportAcquisitionData(params);
          break;
        case 'publish':
          response = await exportPublishRecords(params);
          break;
        case 'statistics':
          response = await exportStatistics(params);
          break;
      }

      // 如果是CSV/Excel，浏览器会自动下载
      if (response) {
        message.success('导出成功！');
      }
    } catch (error: any) {
      message.error('导出失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
      setExportModalVisible(false);
    }
  };

  // 导出配置
  const exportConfig = {
    customers: {
      title: '客户数据',
      icon: <TeamOutlined />,
      description: '导出所有客户信息，包括姓名、电话、公司等',
      filename: `客户数据_${dayjs().format('YYYY-MM-DD')}`
    },
    acquisition: {
      title: '获客数据',
      icon: <DatabaseOutlined />,
      description: '导出发掘的潜在客户数据',
      filename: `获客数据_${dayjs().format('YYYY-MM-DD')}`
    },
    publish: {
      title: '发布记录',
      icon: <VideoCameraOutlined />,
      description: '导出所有内容发布记录和统计数据',
      filename: `发布记录_${dayjs().format('YYYY-MM-DD')}`
    },
    statistics: {
      title: '综合统计',
      icon: <FileExcelOutlined />,
      description: '导出运营数据统计报表',
      filename: `统计报表_${dayjs().format('YYYY-MM-DD')}`
    }
  };

  // 导出类型数据
  const exportTypes = [
    { key: 'customers', label: '客户数据', count: 0, color: 'blue' },
    { key: 'acquisition', label: '获客数据', count: 0, color: 'green' },
    { key: 'publish', label: '发布记录', count: 0, color: 'purple' },
    { key: 'statistics', label: '综合统计', count: 0, color: 'orange' }
  ];

  // 最近导出的模拟记录
  const recentExports = [
    { id: 1, type: 'customers', format: 'CSV', date: '2024-01-15 10:30', size: '2.3MB', records: 1250 },
    { id: 2, type: 'acquisition', format: 'CSV', date: '2024-01-14 15:20', size: '1.8MB', records: 856 },
    { id: 3, type: 'publish', format: 'CSV', date: '2024-01-13 09:15', size: '856KB', records: 324 }
  ];

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">数据报表导出</h1>
        <p className="text-gray-500">一键导出各类数据，支持 CSV/Excel 格式，方便您进行数据分析</p>
      </div>

      {/* 导出卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        {exportTypes.map(item => (
          <Col xs={24} sm={12} lg={6} key={item.key}>
            <Card
              hoverable
              className="text-center cursor-pointer transition-all hover:shadow-lg"
              onClick={() => {
                setExportType(item.key as any);
                setExportModalVisible(true);
              }}
            >
              <div className="text-3xl mb-2" style={{ color: item.color === 'blue' ? '#1677ff' : item.color === 'green' ? '#52c41a' : item.color === 'purple' ? '#722ed1' : '#fa8c16' }}>
                {exportConfig[item.key as keyof typeof exportConfig].icon}
              </div>
              <h3 className="font-medium">{exportConfig[item.key as keyof typeof exportConfig].title}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {exportConfig[item.key as keyof typeof exportConfig].description}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="累计导出次数" value={156} prefix={<DownloadOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="累计导出记录" value="12.5万" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="累计导出大小" value="3.2GB" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="本周导出" value={12} />
          </Card>
        </Col>
      </Row>

      {/* 最近导出记录 */}
      <Card
        title="最近导出记录"
        extra={
          <Button type="link" icon={<DownloadOutlined />}>
            查看全部
          </Button>
        }
      >
        <Table
          dataSource={recentExports}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: '类型',
              dataIndex: 'type',
              render: (type: string) => (
                <Tag color={exportTypes.find(t => t.key === type)?.color}>
                  {exportConfig[type as keyof typeof exportConfig]?.title}
                </Tag>
              )
            },
            { title: '格式', dataIndex: 'format' },
            { title: '记录数', dataIndex: 'records', render: v => v.toLocaleString() },
            { title: '文件大小', dataIndex: 'size' },
            { title: '导出时间', dataIndex: 'date' },
            {
              title: '操作',
              render: () => (
                <Button size="small" icon={<DownloadOutlined />}>
                  重新下载
                </Button>
              )
            }
          ]}
        />
      </Card>

      {/* 导出配置弹窗 */}
      <Modal
        title="配置导出"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={handleExport}
        okText="开始导出"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="导出类型">
            <div className="font-medium text-lg">
              {exportConfig[exportType].icon} {exportConfig[exportType].title}
            </div>
            <div className="text-gray-500 text-sm">
              {exportConfig[exportType].description}
            </div>
          </Form.Item>

          <Form.Item label="导出格式">
            <Select
              value={exportFormat}
              onChange={setExportFormat}
              options={[
                { value: 'csv', label: 'CSV 格式（推荐，兼容性好）' },
                { value: 'xlsx', label: 'Excel 格式（.xlsx）' },
                { value: 'json', label: 'JSON 格式（程序使用）' }
              ]}
            />
          </Form.Item>

          <Form.Item label="文件名称">
            <Input
              value={exportConfig[exportType].filename}
              suffix={`.${exportFormat}`}
            />
          </Form.Item>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">导出说明：</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• CSV 格式可被 Excel、WPS 直接打开</li>
              <li>• 导出的文件会自动下载到您的电脑</li>
              <li>• 大数据量导出可能需要等待几秒钟</li>
              <li>• 数据包含创建时间的最新数据优先</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
