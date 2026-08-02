'use client';

import { Card, Typography, Empty, Table, Tag, Space, Button, App, Input, Select } from 'antd';
import { AppstoreOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface MaterialItem {
  id: string;
  name: string;
  type: string;
  owner: string;
  size?: string;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'text', label: '文案' },
  { value: 'audio', label: '音频' },
];

export default function AgentMaterialsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MaterialItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const request = (await import('@/lib/request')).default;
      const res: any = await request.get('/agent/materials', {
        params: { keyword, type },
      });
      const items = res?.data?.list || res?.list || res?.data || [];
      setList(Array.isArray(items) ? items : []);
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            内容中心
          </Title>
          <Text type="secondary">名下所有客户的素材/内容汇总</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索素材名称"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={load}
          />
          <Select
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
            style={{ width: 140 }}
          />
          <Button type="primary" onClick={load}>查询</Button>
        </Space>
      </Card>

      <Card>
        {list.length === 0 ? (
          <Empty description={loading ? '加载中...' : '暂无素材数据'} />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            dataSource={list}
            pagination={{ pageSize: 20 }}
            columns={[
              { title: '素材名称', dataIndex: 'name', key: 'name' },
              {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                width: 100,
                render: (v: string) => <Tag color="blue">{v || '其他'}</Tag>,
              },
              { title: '所属客户', dataIndex: 'owner', key: 'owner', width: 160 },
              { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
