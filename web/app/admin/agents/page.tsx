'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Cascader,
  message,
  Popconfirm,
  Statistic,
  Spin,
  Empty,
  Divider,
  Descriptions,
  Checkbox,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  GlobalOutlined,
  AreaChartOutlined,
  SettingOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { request } from '@/lib/request'
import type { ApiResponse } from '@/types/api'

const { Title, Text } = Typography
const { Option } = Select

// 代理商类型
interface Agent {
  id: string
  userId: string
  name: string
  phone: string
  level: string
  region?: string
  province?: string
  city?: string
  customerCount: number
  status: 'active' | 'frozen'
  features: string[]
  createTime: string
  expireAt: string
  commissionRate?: number
}

// 到期时间选项
const expireOptions = [
  { value: 1, label: '1个月' },
  { value: 3, label: '3个月' },
  { value: 6, label: '6个月' },
  { value: 12, label: '1年' },
  { value: 24, label: '2年' },
  { value: 36, label: '3年' },
  { value: -1, label: '永久' },
]

// 省市数据
const regionData: Record<string, string[]> = {
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区', '闵行区', '宝山区', '嘉定区', '松江区', '青浦区', '奉贤区', '金山区', '崇明区'],
  '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
  '广东省': ['广州市', '深圳市', '珠海市', '东莞市', '佛山市', '中山市', '惠州市', '汕头市', '江门市', '湛江市', '肇庆市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '韶关市', '揭阳市', '潮州市', '云浮市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
  '四川省': ['成都市', '绵阳市', '德阳市', '宜宾市', '泸州市', '南充市', '达州市', '乐山市', '自贡市', '遂宁市', '内江市', '资阳市', '眉山市', '雅安市', '广安市', '广元市', '巴中市', '攀枝花市', '凉山州', '甘孜州'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄冈市', '孝感市', '荆门市', '鄂州市', '随州市', '咸宁市', '黄石市', '恩施州', '十堰市', '天门市', '仙桃市', '潜江市'],
  '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '邵阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西州'],
  '河南省': ['郑州市', '洛阳市', '开封市', '南阳市', '新乡市', '安阳市', '焦作市', '许昌市', '平顶山市', '商丘市', '周口市', '信阳市', '驻马店市', '濮阳市', '三门峡市', '漯河市', '济源市'],
  '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
  '福建省': ['福州市', '厦门市', '泉州市', '漳州市', '莆田市', '宁德市', '三明市', '南平市', '龙岩市'],
  '安徽省': ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '阜阳市', '宿州市', '滁州市', '六安市', '宣城市', '池州市', '亳州市'],
  '江西省': ['南昌市', '景德镇市', '九江市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市', '新余市', '萍乡市', '鹰潭市'],
  '辽宁省': ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'],
  '吉林省': ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市', '延边州'],
  '黑龙江省': ['哈尔滨市', '齐齐哈尔市', '牡丹江市', '佳木斯市', '大庆市', '伊春市', '鸡西市', '鹤岗市', '双鸭山市', '七台河市', '绥化市', '黑河市', '大兴安岭地区'],
  '陕西省': ['西安市', '宝鸡市', '咸阳市', '铜川市', '渭南市', '延安市', '榆林市', '汉中市', '安康市', '商洛市'],
  '云南省': ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市', '楚雄州', '红河州', '文山州', '西双版纳州', '大理州', '德宏州', '怒江州', '迪庆州'],
  '贵州省': ['贵阳市', '遵义市', '六盘水市', '安顺市', '毕节市', '铜仁市', '黔东南州', '黔南州', '黔西南州'],
  '广西': ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'],
  '海南省': ['海口市', '三亚市', '三沙市', '儋州市'],
  '内蒙古': ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '兴安盟', '锡林郭勒盟', '阿拉善盟'],
  '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
  '甘肃省': ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市', '临夏州', '甘南州'],
  '青海省': ['西宁市', '海东市', '海北州', '黄南州', '海南州', '果洛州', '玉树州', '海西州'],
  '宁夏': ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
  '新疆': ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '阿克苏地区', '喀什地区', '和田地区', '伊犁州', '塔城地区', '阿勒泰地区', '博尔塔拉州', '巴音郭楞州', '昌吉州', '克孜勒苏州'],
  '西藏': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'],
  '天津市': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区', '宁河区', '静海区', '蓟州区'],
  '重庆市': ['万州区', '渝中区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '涪陵区', '长寿区', '璧山区', '合川区', '永川区', '南川区', '大足区', '綦江区', '黔江区', '铜梁区', '潼南区', '荣昌区', '开州区', '梁平区', '武隆区']
}

// 构建级联选择数据
const cascaderOptions = Object.entries(regionData).map(([province, cities]) => ({
  value: province,
  label: province,
  children: cities.map(city => ({
    value: city,
    label: city
  }))
}))

// 功能列表
const allFeatures = [
  { key: 'media', name: '自媒体运营' },
  { key: 'recruitment', name: '招聘助手' },
  { key: 'acquisition', name: '智能获客' },
  { key: 'referral', name: '转介绍' },
  { key: 'share', name: '推荐分享' }
]

export default function AdminAgentsPage() {
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [searchText, setSearchText] = useState('')
  const [editVisible, setEditVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [featureVisible, setFeatureVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 加载代理商列表
  const loadAgents = async () => {
    try {
      setLoading(true)
      const res = await request.get<ApiResponse<{ data: Agent[]; pagination: any }>>('/admin/agents', {
        params: {
          page: pagination.page,
          pageSize: pagination.pageSize
        }
      })
      if (res.data) {
        const agentsData = res.data.data.map((agent: any) => ({
          id: agent.id,
          userId: agent.userId,
          name: agent.name || agent.user?.name || '未知',
          phone: agent.user?.phone || '',
          level: agent.level || 'district',
          region: agent.region,
          province: agent.province,
          city: agent.city,
          customerCount: agent._count?.customers || 0,
          status: agent.status === 'frozen' ? 'frozen' : 'active',
          features: [], // 需要单独获取
          createTime: agent.user?.createdAt ? dayjs(agent.user.createdAt).format('YYYY-MM-DD') : '',
          expireAt: agent.expireAt || '',
          commissionRate: agent.commissionRate
        }))
        setAgents(agentsData)
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination?.total || 0
          }))
        }
      }
    } catch (error: any) {
      message.error('加载代理商列表失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [pagination.page, pagination.pageSize])

  // 搜索过滤
  const filteredAgents = useMemo(() => {
    return agents.filter(a => 
      !searchText || 
      a.name.toLowerCase().includes(searchText.toLowerCase()) ||
      a.phone.includes(searchText) ||
      (a.province && a.province.includes(searchText)) ||
      (a.city && a.city.includes(searchText))
    )
  }, [agents, searchText])

  // 创建代理商
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const { region, expireMonths, ...rest } = values
      const [province, city] = region || []
      
      await request.post('/admin/agents', {
        ...rest,
        province,
        city,
        password: '123456', // 默认密码
        expireMonths
      })
      
      message.success(`已开通代理商：${values.name}，登录账号：${values.phone}，初始密码：123456`)
      setCreateVisible(false)
      createForm.resetFields()
      loadAgents()
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
      } else {
        message.error('创建代理商失败: ' + (error.message || '未知错误'))
      }
    }
  }

  // 编辑代理商
  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent)
    form.setFieldsValue({
      name: agent.name,
      phone: agent.phone,
      region: [agent.province, agent.city],
      commissionRate: agent.commissionRate
    })
    setEditVisible(true)
  }

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (!selectedAgent) return
      
      const { region, ...rest } = values
      const [province, city] = region || []
      
      await request.put(`/admin/agents/${selectedAgent.id}`, {
        ...rest,
        province,
        city
      })
      
      message.success('保存成功')
      setEditVisible(false)
      loadAgents()
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
      } else {
        message.error('保存失败: ' + (error.message || '未知错误'))
      }
    }
  }

  // 冻结/解冻
  const handleToggleStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === 'active' ? 'frozen' : 'active'
      await request.put(`/admin/agents/${agent.id}`, { status: newStatus })
      message.success(`${agent.name} 已${newStatus === 'active' ? '解冻' : '冻结'}`)
      loadAgents()
    } catch (error: any) {
      message.error('操作失败: ' + (error.message || '未知错误'))
    }
  }

  // 删除代理商
  const handleDelete = async (agent: Agent) => {
    try {
      await request.delete(`/admin/agents/${agent.id}`)
      message.success('删除成功')
      loadAgents()
    } catch (error: any) {
      message.error('删除失败: ' + (error.message || '未知错误'))
    }
  }

  // 查看详情
  const handleViewDetail = async (agent: Agent) => {
    try {
      const res = await request.get<ApiResponse<Agent>>(`/admin/agents/${agent.id}`)
      if (res.data) {
        setSelectedAgent({
          ...agent,
          ...res.data.data,
          createTime: res.data.data.user?.createdAt ? dayjs(res.data.data.user.createdAt).format('YYYY-MM-DD') : '',
          customerCount: res.data.data._count?.customers || 0
        })
        setDetailVisible(true)
      }
    } catch (error: any) {
      message.error('获取详情失败: ' + (error.message || '未知错误'))
    }
  }

  // 打开功能设置
  const handleOpenFeatures = async (agent: Agent) => {
    try {
      // 获取代理商详情
      const res = await request.get<ApiResponse<Agent>>(`/admin/agents/${agent.id}`)
      if (res.data) {
        setSelectedAgent(res.data.data)
        setSelectedFeatures(res.data.data.features || [])
        setFeatureVisible(true)
      }
    } catch (error: any) {
      message.error('获取详情失败: ' + (error.message || '未知错误'))
    }
  }

  // 保存功能设置
  const handleSaveFeatures = async () => {
    try {
      if (!selectedAgent) return
      
      await request.put(`/admin/agents/${selectedAgent.id}/features`, {
        features: selectedFeatures
      })
      
      message.success('可售卖功能已更新')
      setFeatureVisible(false)
      loadAgents()
    } catch (error: any) {
      message.error('保存失败: ' + (error.message || '未知错误'))
    }
  }

  // 获取功能标签
  const getFeatureTags = (features: string[]) => (
    <Space size={4} wrap>
      {allFeatures.map(f => (
        <Tag 
          key={f.key} 
          color={features?.includes?.(f.key) ? 'blue' : 'default'}
        >
          {f.name}
        </Tag>
      ))}
    </Space>
  )

  // 渲染区域列
  const renderRegion = (record: Agent) => (
    <Tag icon={<AreaChartOutlined />} color="blue">
      {record.province || ''} {record.city ? '· ' + record.city : ''}
    </Tag>
  )

  const columns: ColumnsType<Agent> = [
    {
      title: '代理商',
      key: 'agent',
      render: (_, record) => (
        <Space>
          <GlobalOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '负责区域',
      key: 'region',
      render: (_, record) => renderRegion(record)
    },
    {
      title: '客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      sorter: (a, b) => a.customerCount - b.customerCount,
      render: (count: number) => (
        <Text strong style={{ color: '#1890ff' }}>{count}</Text>
      )
    },
    {
      title: '功能',
      dataIndex: 'features',
      key: 'features',
      width: 300,
      render: (features: string[]) => getFeatureTags(features)
    },
    {
      title: '到期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 120,
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '正常' : '已冻结'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '冻结' : '解冻'}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenFeatures(record)}
          >
            功能
          </Button>
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该代理商？"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const stats = useMemo(() => {
    const total = agents.length
    const active = agents.filter(a => a.status === 'active').length
    const totalCustomers = agents.reduce((sum, a) => sum + a.customerCount, 0)
    return { total, active, totalCustomers }
  }, [agents])

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>代理商管理</Title>
          <Text type="secondary">创建/冻结区域代理账号，设置可售卖功能范围</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadAgents}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            createForm.resetFields()
            createForm.setFieldsValue({
              status: 'active',
              expireMonths: 12,
            })
            setCreateVisible(true)
          }}>
            开通代理商
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic 
              title="代理商总数" 
              value={stats.total} 
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic 
              title="正常" 
              value={stats.active} 
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>个</span>}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic 
              title="客户总数" 
              value={stats.totalCustomers} 
              prefix={<GlobalOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input.Search 
            placeholder="搜索代理商名称/手机号/区域" 
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
        </div>

        <Spin spinning={loading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredAgents}
            pagination={{ 
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => {
                setPagination({ page, pageSize, total })
              }
            }}
            locale={{
              emptyText: (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      {searchText ? '未找到匹配的代理商' : '暂无代理商数据'}
                    </span>
                  }
                >
                  {!searchText && (
                    <Button type="primary" onClick={() => setCreateVisible(true)}>开通第一个代理商</Button>
                  )}
                </Empty>
              )
            }}
          />
        </Spin>
      </Card>

      {/* 开通代理商弹窗 */}
      <Modal
        title="开通代理商"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText="确认开通"
        cancelText="取消"
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="代理商名称" rules={[{ required: true, message: '请输入代理商名称' }]}>
                <Input placeholder="请输入代理商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号码（登录账号）" rules={[{ required: true, message: '请输入手机号码' }]}>
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="region" label="负责区域（省/市）">
                <Cascader 
                  options={cascaderOptions} 
                  placeholder="选择省/市" 
                  changeOnSelect
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expireMonths" label="有效时间" rules={[{ required: true, message: '请选择有效时间' }]}>
                <Select placeholder="选择有效时间">
                  {expireOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commissionRate" label="分成比例">
                <Input type="number" suffix="%" placeholder="例如：30" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="代理等级">
                <Select placeholder="选择等级">
                  <Option value="city">市级代理</Option>
                  <Option value="district">区/县代理</Option>
                  <Option value="province">省级代理</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
            <Text type="secondary">
              <UserOutlined /> 登录账号：手机号码<br />
              <LockOutlined /> 初始密码：123456（代理商自行修改）
            </Text>
          </Card>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑代理商"
        open={editVisible}
        onOk={handleSave}
        onCancel={() => setEditVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="代理商名称" rules={[{ required: true, message: '请输入代理商名称' }]}>
                <Input placeholder="请输入代理商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号码" rules={[{ required: true, message: '请输入手机号码' }]}>
                <Input placeholder="请输入手机号码" disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="region" label="负责区域（省/市）">
                <Cascader 
                  options={cascaderOptions} 
                  placeholder="选择省/市" 
                  changeOnSelect
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commissionRate" label="分成比例">
                <Input type="number" suffix="%" placeholder="例如：30" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 功能设置弹窗 */}
      <Modal
        title="设置可售卖功能"
        open={featureVisible}
        onOk={handleSaveFeatures}
        onCancel={() => setFeatureVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        {selectedAgent && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="代理商名称">{selectedAgent.name}</Descriptions.Item>
              <Descriptions.Item label="手机号码">{selectedAgent.phone}</Descriptions.Item>
            </Descriptions>
            <Divider>选择可售卖给该代理商的功能</Divider>
            <Checkbox.Group
              value={selectedFeatures}
              onChange={(values) => setSelectedFeatures(values as string[])}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                {allFeatures.map(f => (
                  <Col span={12} key={f.key}>
                    <Checkbox value={f.key}>{f.name}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="代理商详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {selectedAgent && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="代理商名称" span={2}>
                <Space>
                  <GlobalOutlined style={{ color: '#1890ff' }} />
                  {selectedAgent.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="手机号码">{selectedAgent.phone}</Descriptions.Item>
              <Descriptions.Item label="代理等级">
                {selectedAgent.level === 'province' ? '省级代理' : 
                 selectedAgent.level === 'city' ? '市级代理' : '区/县代理'}
              </Descriptions.Item>
              <Descriptions.Item label="负责区域" span={2}>
                {selectedAgent.province} {selectedAgent.city}
              </Descriptions.Item>
              <Descriptions.Item label="分成比例">{selectedAgent.commissionRate}%</Descriptions.Item>
              <Descriptions.Item label="客户数量">{selectedAgent.customerCount}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedAgent.createTime}</Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {selectedAgent.expireAt ? dayjs(selectedAgent.expireAt).format('YYYY-MM-DD') : '永久'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedAgent.status === 'active' ? 'green' : 'orange'}>
                  {selectedAgent.status === 'active' ? '正常' : '已冻结'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="可售卖功能" span={2}>
                {getFeatureTags(selectedAgent.features)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}
