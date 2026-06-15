'use client';

import { useState, useEffect } from 'react';
import { Table, Switch, Card, message, Select, Space, Tag, Button, Modal, Tree } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import request from '@/lib/request';
import { customerService } from '@/services/agent';

const { Option } = Select;

interface Feature {
  code: string;
  name: string;
  enabled: boolean;
  subFeatures?: SubFeature[];
}

interface SubFeature {
  code: string;
  name: string;
  enabled: boolean;
  effectiveEnabled?: boolean;
}

export default function AgentFeaturesPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerFeatures, setCustomerFeatures] = useState<any[]>([]);

  // 获取名下客户列表
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 获取功能开关列表
  useEffect(() => {
    if (user?.id) {
      fetchFeatures();
    }
  }, [user]);

  // 选择客户后获取其功能开关状态
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerFeatures(selectedCustomer);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getCustomers({ pageSize: 100 });
      if (res.data) {
        setCustomers(res.data);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await fetch(`/api/admin/features`, {
<<<<<<< HEAD
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
=======
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());
      if (res.data) {
        setFeatures(res.data);
      }
    } catch (error) {
      console.error('获取功能列表失败:', error);
    }
  };

  const fetchCustomerFeatures = async (customerId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/features?userId=${customerId}`, {
<<<<<<< HEAD
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
=======
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());
      if (res.data) {
        setCustomerFeatures(res.data);
      }
    } catch (error) {
      console.error('获取客户功能失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换功能开关
  const handleToggleFeature = async (featureCode: string, enabled: boolean) => {
    if (!selectedCustomer) {
      message.warning('请先选择客户');
      return;
    }

    try {
      const res = await fetch(`/api/user/features/${featureCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
<<<<<<< HEAD
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: selectedCustomer,
          enabled
        })
=======
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: selectedCustomer,
          enabled,
        }),
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());

      if (res.success) {
        message.success(`已${enabled ? '开启' : '关闭'}功能`);
        fetchCustomerFeatures(selectedCustomer);
      }
    } catch (error) {
      console.error('更新功能失败:', error);
      message.error('更新失败');
    }
  };

  // 批量设置功能
  const handleBatchSet = async (enabled: boolean) => {
    if (!selectedCustomer) {
      message.warning('请先选择客户');
      return;
    }

    try {
      const res = await fetch(`/api/user/features/batch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
<<<<<<< HEAD
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: selectedCustomer,
          enabled
        })
=======
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: selectedCustomer,
          enabled,
        }),
>>>>>>> 962968886be726cd434c792933b5515366d34518
      }).then(r => r.json());

      if (res.success) {
        message.success(`已${enabled ? '开启' : '关闭'}全部功能`);
        fetchCustomerFeatures(selectedCustomer);
      }
    } catch (error) {
      console.error('批量设置失败:', error);
      message.error('批量设置失败');
    }
  };

  const columns = [
    {
      title: '功能名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '功能代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
<<<<<<< HEAD
      render: (code: string) => <Tag>{code}</Tag>
=======
      render: (code: string) => <Tag>{code}</Tag>,
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '全局状态',
      dataIndex: 'enabled',
      key: 'globalEnabled',
      width: 100,
      render: (enabled: boolean) => (
<<<<<<< HEAD
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '全局开启' : '全局关闭'}
        </Tag>
      )
=======
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '全局开启' : '全局关闭'}</Tag>
      ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '客户状态',
      dataIndex: 'enabled',
      key: 'customerEnabled',
      width: 120,
      render: (enabled: boolean, record: any) => (
        <Switch
          checked={enabled}
<<<<<<< HEAD
          onChange={(checked) => handleToggleFeature(record.code, checked)}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      )
=======
          onChange={checked => handleToggleFeature(record.code, checked)}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      ),
>>>>>>> 962968886be726cd434c792933b5515366d34518
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="客户功能开关管理"
        extra={
          <Space>
            <Select
              placeholder="选择客户"
              style={{ width: 200 }}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              showSearch
              optionFilterProp="children"
            >
              {customers.map((customer: any) => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name || customer.phone}
                </Option>
              ))}
            </Select>
            {selectedCustomer && (
              <>
                <Button onClick={() => handleBatchSet(true)}>开启全部</Button>
                <Button onClick={() => handleBatchSet(false)}>关闭全部</Button>
              </>
            )}
          </Space>
        }
      >
        {!selectedCustomer && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            请先选择要管理的客户
          </div>
        )}
<<<<<<< HEAD
        
=======

>>>>>>> 962968886be726cd434c792933b5515366d34518
        {selectedCustomer && (
          <Table
            columns={columns}
            dataSource={customerFeatures}
            rowKey="code"
            loading={loading}
            pagination={false}
            expandable={{
<<<<<<< HEAD
              expandedRowRender: (record) => (
                <div style={{ padding: '0 0 0 48px' }}>
                  {record.subFeatures?.length > 0 ? (
                    record.subFeatures.map((sub: any) => (
                      <div key={sub.code} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 16, 
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
=======
              expandedRowRender: record => (
                <div style={{ padding: '0 0 0 48px' }}>
                  {record.subFeatures?.length > 0 ? (
                    record.subFeatures.map((sub: any) => (
                      <div
                        key={sub.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '8px 0',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
>>>>>>> 962968886be726cd434c792933b5515366d34518
                        <span style={{ width: 200 }}>{sub.name}</span>
                        <Tag>{sub.code}</Tag>
                        <Switch
                          size="small"
                          checked={sub.effectiveEnabled}
                          disabled={!sub.enabled}
<<<<<<< HEAD
                          onChange={(checked) => handleToggleFeature(sub.code, checked)}
=======
                          onChange={checked => handleToggleFeature(sub.code, checked)}
>>>>>>> 962968886be726cd434c792933b5515366d34518
                        />
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {sub.effectiveEnabled ? '已开启' : '已关闭'}
                          {!sub.enabled && ' (主功能已关闭)'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#999' }}>无子功能</span>
                  )}
                </div>
              ),
<<<<<<< HEAD
              rowExpandable: (record) => (record.subFeatures?.length || 0) > 0,
=======
              rowExpandable: record => (record.subFeatures?.length || 0) > 0,
>>>>>>> 962968886be726cd434c792933b5515366d34518
            }}
          />
        )}
      </Card>
    </div>
  );
}
