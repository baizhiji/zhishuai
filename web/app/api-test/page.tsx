'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Table, message, Tag, Space, Tabs, Descriptions } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import apiAdapter from '@/services/apiAdapter';
import type { Material, User, Account, Job } from '@/types/api';

export default function ApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // 测试登录
  const testLogin = async () => {
    setLoading(true);
    try {
      const result = await apiAdapter.auth.login('13800138000', '123456');
      message.success('登录测试成功');
      console.log('登录结果:', result);
    } catch (error) {
      message.error('登录测试失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取用户信息
  const testGetUserInfo = async () => {
    setLoading(true);
    try {
      const result = await apiAdapter.auth.getUserInfo();
      setUser(result);
      message.success('获取用户信息成功');
      console.log('用户信息:', result);
    } catch (error) {
      message.error('获取用户信息失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取素材列表
  const testGetMaterials = async () => {
    setLoading(true);
    try {
      const result = await apiAdapter.materials.list({ page: 1, pageSize: 10 });
      setMaterials(result.list);
      message.success('获取素材列表成功');
      console.log('素材列表:', result);
    } catch (error) {
      message.error('获取素材列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取账号列表
  const testGetAccounts = async () => {
    setLoading(true);
    try {
      const result = await apiAdapter.accounts.list();
      setAccounts(result);
      message.success('获取账号列表成功');
      console.log('账号列表:', result);
    } catch (error) {
      message.error('获取账号列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取职位列表
  const testGetJobs = async () => {
    setLoading(true);
    try {
      const result = await apiAdapter.recruitment.getJobs();
      setJobs(result);
      message.success('获取职位列表成功');
      console.log('职位列表:', result);
    } catch (error) {
      message.error('获取职位列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 素材列表表格列
  const materialColumns: ColumnsType<Material> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap: any = {
          text: '文案',
          image: '图片',
          video: '视频',
          'digital-human': '数字人',
          ecommerce: '电商'
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        return status === 'unused' ? (
          <Tag color="green">未使用</Tag>
        ) : (
          <Tag color="red">已使用</Tag>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    }
  ];

  // 账号列表表格列
  const accountColumns: ColumnsType<Account> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => {
        const platformMap: any = {
          douyin: '抖音',
          xiaohongshu: '小红书',
          weibo: '微博',
          wechat: '微信',
          bilibili: '哔哩哔哩'
        };
        return <Tag color="purple">{platformMap[platform] || platform}</Tag>;
      }
    },
    {
      title: '账号名称',
      dataIndex: 'accountName',
      key: 'accountName'
    },
    {
      title: '粉丝数',
      dataIndex: 'followerCount',
      key: 'followerCount'
    },
    {
      title: '自动发布',
      dataIndex: 'autoPublish',
      key: 'autoPublish',
      render: (autoPublish) => (autoPublish ? <Tag color="green">开启</Tag> : <Tag>关闭</Tag>)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        return status === 'active' ? (
          <Tag color="green">正常</Tag>
        ) : (
          <Tag color="red">异常</Tag>
        );
      }
    }
  ];

  // 职位列表表格列
  const jobColumns: ColumnsType<Job> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '薪资',
      key: 'salary',
      render: (_, record) => `${record.salaryMin}-${record.salaryMax}k`
    },
    {
      title: '经验要求',
      dataIndex: 'experience',
      key: 'experience'
    },
    {
      title: '学历要求',
      dataIndex: 'education',
      key: 'education'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="API测试页面" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="API模式">
            <Tag color={process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'blue' : 'green'}>
              {process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'Mock模式' : '真实API'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="API地址">
            {process.env.NEXT_PUBLIC_API_BASE_URL}
          </Descriptions.Item>
        </Descriptions>

        <Space wrap style={{ marginTop: 16 }}>
          <Button type="primary" loading={loading} onClick={testLogin}>
            测试登录
          </Button>
          <Button loading={loading} onClick={testGetUserInfo}>
            测试获取用户信息
          </Button>
          <Button loading={loading} onClick={testGetMaterials}>
            测试获取素材列表
          </Button>
          <Button loading={loading} onClick={testGetAccounts}>
            测试获取账号列表
          </Button>
          <Button loading={loading} onClick={testGetJobs}>
            测试获取职位列表
          </Button>
        </Space>
      </Card>

      <Tabs
        defaultActiveKey="user"
        items={[
          {
            key: 'user',
            label: '用户信息',
            children: (
              <Card title="用户信息">
                {user ? (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
                    <Descriptions.Item label="用户名">{user.name}</Descriptions.Item>
                    <Descriptions.Item label="手机号">{user.phone}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="角色">
                      <Tag color="blue">{user.role}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color="green">{user.status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <div style={{ textAlign: 'center', color: '#999' }}>暂无数据</div>
                )}
              </Card>
            )
          },
          {
            key: 'materials',
            label: '素材列表',
            children: (
              <Card title="素材列表">
                <Table
                  columns={materialColumns}
                  dataSource={materials}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: 'accounts',
            label: '账号列表',
            children: (
              <Card title="账号列表">
                <Table
                  columns={accountColumns}
                  dataSource={accounts}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: 'jobs',
            label: '职位列表',
            children: (
              <Card title="职位列表">
                <Table columns={jobColumns} dataSource={jobs} rowKey="id" pagination={false} />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
}
