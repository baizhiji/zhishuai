'use client';

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Card, Row, Col, Select, DatePicker, Button, Table, Space, Modal, Spin, message } from 'antd';
import { FileExcelOutlined, FileTextOutlined, DownloadOutlined, TableOutlined } from '@ant-design/icons';
=======
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  Modal,
  Spin,
  message,
} from 'antd';
import {
  FileExcelOutlined,
  FileTextOutlined,
  DownloadOutlined,
  TableOutlined,
} from '@ant-design/icons';
>>>>>>> 962968886be726cd434c792933b5515366d34518
import type { ColumnsType } from 'antd/es/table';
import { getReportTypes, generateReport, type ReportType } from '@/services/report';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;
const { Option } = Select;

const REPORT_ICONS: Record<string, any> = {
  users: <TableOutlined />,
  agents: <TableOutlined />,
  materials: <FileTextOutlined />,
  posts: <FileTextOutlined />,
  recruitment: <FileTextOutlined />,
  acquisition: <FileTextOutlined />,
  api_usage: <FileExcelOutlined />,
};

export default function ReportExportPage() {
  const [loading, setLoading] = useState(false);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    loadReportTypes();
  }, []);

  const loadReportTypes = async () => {
    try {
      const types = await getReportTypes();
      setReportTypes(types);
    } catch (error) {
      message.error('加载报表类型失败');
    }
  };

  const handleGenerate = async (format: 'json' | 'csv' = 'json') => {
    if (!selectedType) {
      message.warning('请选择报表类型');
      return;
    }

    setLoading(true);
    try {
      const [startDate, endDate] = dateRange || [];
      const result = await generateReport({
        type: selectedType,
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        format,
      });

      if (format === 'csv') {
        // CSV 下载
        const blob = new Blob([result as any], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${result.reportName}_${Date.now()}.csv`;
        link.click();
        message.success('CSV 导出成功');
      } else {
        // JSON 预览
        setPreviewData(result.data);
        setPreviewTitle(result.reportName);
        setPreviewVisible(true);
        message.success(`生成成功，共 ${result.total} 条数据`);
      }
    } catch (error) {
      message.error('生成报表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (previewData.length === 0) {
      message.warning('请先生成报表');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(previewData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '报表');
    XLSX.writeFile(wb, `${previewTitle}_${Date.now()}.xlsx`);
    message.success('Excel 导出成功');
  };

  const reportCards = reportTypes.map((rt, index) => (
    <Col span={6} key={rt.key}>
      <Card
        hoverable
        onClick={() => setSelectedType(rt.key)}
        style={{
          borderColor: selectedType === rt.key ? '#1890ff' : undefined,
          background: selectedType === rt.key ? '#e6f7ff' : undefined,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} align="center">
          <div style={{ fontSize: 32, color: selectedType === rt.key ? '#1890ff' : '#999' }}>
            {REPORT_ICONS[rt.key] || <TableOutlined />}
          </div>
          <div style={{ fontWeight: 500 }}>{rt.name}</div>
        </Space>
      </Card>
    </Col>
  ));

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>数据报表导出</h1>

      <Card title="选择报表类型" style={{ marginBottom: 24 }}>
<<<<<<< HEAD
        <Row gutter={16}>
          {reportCards}
        </Row>
=======
        <Row gutter={16}>{reportCards}</Row>
>>>>>>> 962968886be726cd434c792933b5515366d34518
      </Card>

      <Card title="报表设置">
        <Space wrap style={{ marginBottom: 24 }}>
<<<<<<< HEAD
          <RangePicker onChange={(dates) => setDateRange(dates || [])} />
=======
          <RangePicker onChange={dates => setDateRange(dates || [])} />
>>>>>>> 962968886be726cd434c792933b5515366d34518
          <Button
            type="primary"
            icon={<TableOutlined />}
            onClick={() => handleGenerate('json')}
            loading={loading}
          >
            生成报表
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleGenerate('csv')}
            loading={loading}
          >
            导出 CSV
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            disabled={previewData.length === 0}
          >
            导出 Excel
          </Button>
        </Space>

        {selectedType && (
          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <strong>已选择：</strong>
            {reportTypes.find(r => r.key === selectedType)?.name}
            {dateRange.length === 2 && (
<<<<<<< HEAD
              <span>，时间范围：{dateRange[0].format('YYYY-MM-DD')} 至 {dateRange[1].format('YYYY-MM-DD')}</span>
=======
              <span>
                ，时间范围：{dateRange[0].format('YYYY-MM-DD')} 至{' '}
                {dateRange[1].format('YYYY-MM-DD')}
              </span>
>>>>>>> 962968886be726cd434c792933b5515366d34518
            )}
          </div>
        )}
      </Card>

      <Modal
        title={`${previewTitle} - 预览`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        footer={[
<<<<<<< HEAD
          <Button key="export" type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
=======
          <Button
            key="export"
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
          >
>>>>>>> 962968886be726cd434c792933b5515366d34518
            导出 Excel
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {previewData.length > 0 ? (
          <Table
            dataSource={previewData}
            rowKey={(record, index) => String(index)}
            scroll={{ x: true }}
            pagination={{ pageSize: 10, total: previewData.length }}
            size="small"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
            <div style={{ marginTop: 16 }}>正在生成报表...</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
