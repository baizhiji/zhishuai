'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Spin,
  message,
  Table,
  Tag,
  Space,
  Empty,
  Typography,
  Popconfirm,
  Input,
  Steps,
  Tabs,
  Alert,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  ImportOutlined,
  FileTextOutlined,
  CopyOutlined,
  InboxOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 平台配置
const PLATFORMS = [
  { id: 'douyin', name: '抖音', color: '#fe2c55', icon: '🎵' },
  { id: 'kuaishou', name: '快手', color: '#ff4906', icon: '📹' },
  { id: 'xiaohongshu', name: '小红书', color: '#ff2442', icon: '📕' },
  { id: 'weibo', name: '微博', color: '#e6162d', icon: '🌐' },
  { id: 'channels', name: '视频号', color: '#07c160', icon: '📱' },
  { id: 'boss', name: 'BOSS直聘', color: '#00be76', icon: '💼' },
  { id: 'liepin', name: '猎聘', color: '#FF6000', icon: '📋' },
  { id: 'zhilian', name: '智联招聘', color: '#0066CC', icon: '📊' },
];

interface SocialAccount {
  id: string;
  platform: string;
  platformName?: string;
  platformIcon?: string;
  platformColor?: string;
  accountName: string;
  avatar?: string;
  status: string;
  isConnected?: boolean;
  lastSyncAt?: string;
}

interface AuthSession {
  sessionId: string;
  platform: string;
  platformName: string;
  popupUrl: string;
  expiresAt: string;
}

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Cookie 导入状态
  const [cookieModalVisible, setCookieModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [cookieJson, setCookieJson] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [importing, setImporting] = useState(false);

  // Popup 授权流程状态
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authStep, setAuthStep] = useState(0);
  const [popupAccountName, setPopupAccountName] = useState('');
  const [polling, setPolling] = useState(false);

  // 加载已绑定的账号
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await request.get('/api/social/accounts');
      if (res.code === 0) {
        setAccounts(res.data || []);
      }
    } catch (error) {
      console.error('加载账号失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // ============ Cookie 导入方式 ============

  const openCookieImport = (platform: string) => {
    setSelectedPlatform(platform);
    setCookieJson('');
    setAccountNameInput('');
    setCookieModalVisible(true);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCookieJson(text);
      message.success('文件已读取，请点击"导入绑定"');
    };
    reader.onerror = () => {
      message.error('文件读取失败');
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  const handleCookieImport = async () => {
    if (!selectedPlatform) {
      message.error('请选择平台');
      return;
    }

    if (!cookieJson.trim()) {
      message.error('请粘贴或上传 Cookie JSON 数据');
      return;
    }

    // 验证是否为有效 JSON
    let parsedData: any;
    try {
      parsedData = JSON.parse(cookieJson.trim());
    } catch {
      message.error('Cookie 数据不是有效的 JSON 格式');
      return;
    }

    setImporting(true);
    try {
      const res = await request.post('/api/social/cookie-import', {
        platform: selectedPlatform,
        cookieData: parsedData,
        accountName: accountNameInput.trim() || undefined,
      });

      if (res.code === 0) {
        message.success(res.message || 'Cookie 导入绑定成功！');
        setCookieModalVisible(false);
        loadAccounts();
      } else {
        message.error(res.message || 'Cookie 导入失败');
      }
    } catch (error: any) {
      message.error('Cookie 导入失败: ' + (error.message || '网络错误'));
    } finally {
      setImporting(false);
    }
  };

  // ============ Popup 授权方式 ============

  const startAuth = async (platform: string) => {
    try {
      const res = await request.post('/api/social/session/create', { platform });

      const isSuccess = res && (res.code === 0 || res.success === true);
      if (isSuccess && res.data) {
        const sessionData: AuthSession = {
          sessionId: res.data.sessionId,
          platform: res.data.platform || platform,
          platformName: res.data.platformName || PLATFORMS.find(p => p.id === platform)?.name || platform,
          popupUrl: res.data.popupUrl,
          expiresAt: res.data.expiresAt,
        };

        setAuthSession(sessionData);
        setAuthStep(0);
        setAuthModalVisible(true);
        setPolling(false);
        setPopupAccountName('');
      } else {
        message.error('创建授权会话失败: ' + (res?.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('API Error:', error);
      message.error('创建授权会话失败: ' + (error.message || '网络错误'));
    }
  };

  const openPopupWindow = () => {
    if (!authSession?.popupUrl) {
      message.error('无法获取平台登录页URL');
      return;
    }

    const popup = window.open(
      authSession.popupUrl,
      `${authSession.platformName}_login`,
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      message.error('无法打开新窗口，请检查浏览器是否阻止了弹出窗口');
      return;
    }

    setAuthStep(1);
    setPolling(true);
    message.info(`已打开 ${authSession.platformName} 登录窗口，请在新窗口中扫码登录`);
  };

  // 轮询授权状态
  useEffect(() => {
    if (!authSession || !polling) return;

    const pollStatus = async () => {
      try {
        const res = await request.get(`/api/social/session/${authSession.sessionId}/status`);

        if (res.code === 0 || res.success) {
          const status = res.data?.status;

          if (status === 'success') {
            setPolling(false);
            setAuthStep(2);
            message.success('授权成功！正在绑定账号...');
            setTimeout(() => {
              setAuthModalVisible(false);
              loadAccounts();
            }, 2000);
          } else if (status === 'expired') {
            setPolling(false);
            message.error('授权会话已过期，请重新操作');
          }
        }
      } catch (error) {
        console.error('轮询状态失败:', error);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [authSession, polling]);

  const confirmAuth = async () => {
    if (!authSession || !popupAccountName.trim()) {
      message.error('请输入账号名称');
      return;
    }

    try {
      const res = await request.post(`/api/social/session/${authSession.sessionId}/confirm`, {
        accountName: popupAccountName.trim(),
      });

      if (res.code === 0 || res.success) {
        message.success('授权确认成功！');
        setAuthModalVisible(false);
        loadAccounts();
      } else {
        message.error('确认失败: ' + (res?.message || '未知错误'));
      }
    } catch (error: any) {
      message.error('确认失败: ' + error.message);
    }
  };

  // 解绑账号
  const unbindAccount = async (accountId: string) => {
    try {
      const res = await request.delete(`/api/social/accounts/${accountId}`);
      if (res.code === 0) {
        message.success('解绑成功');
        loadAccounts();
      } else {
        message.error('解绑失败');
      }
    } catch (error) {
      message.error('解绑失败');
    }
  };

  // 智能刷新 Cookie（自动验证 + 自动更新）
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const smartRefresh = async (accountId: string) => {
    setRefreshingIds(prev => new Set(prev).add(accountId));
    try {
      const res = await request.post(`/api/social/accounts/${accountId}/refresh`);
      if (res.code === 0) {
        const healthy = res.data?.healthy;
        if (healthy) {
          message.success('Cookie 验证通过，已自动更新为最新版本');
        } else {
          message.warning(res.data?.reason || 'Cookie 已失效，请重新导入');
          // 自动打开 Cookie 导入弹窗
          const account = accounts.find(a => a.id === accountId);
          if (account) {
            openCookieImport(account.platform);
          }
        }
        loadAccounts();
      } else {
        message.error(res.message || '刷新失败');
      }
    } catch (error: any) {
      message.error('刷新失败: ' + (error.message || '网络错误'));
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (text: string, record: SocialAccount) => {
        const platform = PLATFORMS.find(p => p.id === text);
        const icon = record.platformIcon || platform?.icon || '🔗';
        const name = record.platformName || platform?.name || text;
        return (
          <Space>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontWeight: 500 }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: '账号',
      dataIndex: 'accountName',
      key: 'accountName',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: SocialAccount) => {
        const isActive = record.isConnected && record.status === 'active';
        const isExpired = record.status === 'expired';
        const hasError = record.status === 'error' || record.syncError;
        return (
          <Space>
            <Tag color={isActive ? 'green' : isExpired ? 'red' : hasError ? 'orange' : 'default'}>
              {isActive ? '已连接' : isExpired ? '已过期' : hasError ? '异常' : '未连接'}
            </Tag>
            {record.lastSyncAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(record.lastSyncAt).toLocaleDateString()}
              </Text>
            )}
            {hasError && record.syncError && (
              <Text type="secondary" style={{ fontSize: 11, color: '#ff4d4f' }}>
                {record.syncError}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SocialAccount) => (
        <Space>
          <Button
            type="link"
            icon={<SyncOutlined spin={refreshingIds.has(record.id)} />}
            onClick={() => smartRefresh(record.id)}
            loading={refreshingIds.has(record.id)}
            size="small"
          >
            智能刷新
          </Button>
          <Button
            type="link"
            icon={<ImportOutlined />}
            onClick={() => openCookieImport(record.platform)}
            size="small"
          >
            手动更新
          </Button>
          <Popconfirm
            title="确定要解绑此账号吗？"
            onConfirm={() => unbindAccount(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              解绑
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const selectedPlatformConfig = PLATFORMS.find(p => p.id === selectedPlatform);

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>社交账号管理</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        连接你的社交媒体和招聘平台账号，实现自动化运营
      </Text>

      {/* 平台选择卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {PLATFORMS.map(platform => {
          const account = accounts.find(a => a.platform === platform.id);
          const isActive = account?.isConnected && account?.status === 'active';
          const isExpired = account?.status === 'expired';
          return (
            <Col xs={12} sm={8} md={6} lg={3} key={platform.id}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  borderColor: isExpired ? '#ff4d4f' : isActive ? platform.color : undefined,
                  borderWidth: isActive || isExpired ? 2 : 1,
                }}
                onClick={() => openCookieImport(platform.id)}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{platform.icon}</div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{platform.name}</div>
                {isActive ? (
                  <Tag color="green" style={{ marginTop: 8, fontSize: 11 }}>
                    <CheckCircleOutlined /> 已连接
                  </Tag>
                ) : isExpired ? (
                  <Tag color="red" style={{ marginTop: 8, fontSize: 11 }}>
                    已过期
                  </Tag>
                ) : (
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
                    点击绑定
                  </Text>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 已绑定账号列表 */}
      <Card title="已连接的账号">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : accounts.length > 0 ? (
          <Table columns={columns} dataSource={accounts} rowKey="id" pagination={false} />
        ) : (
          <Empty description="暂无已连接的账号，点击上方平台卡片开始绑定" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* ============ Cookie 导入弹窗 ============ */}
      <Modal
        title={
          <Space>
            <ImportOutlined />
            <span>导入 Cookie 绑定 {selectedPlatformConfig?.name || ''}</span>
          </Space>
        }
        open={cookieModalVisible}
        onCancel={() => setCookieModalVisible(false)}
        width={640}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            showIcon
            message="如何获取 Cookie？"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  1. 在浏览器中打开 {selectedPlatformConfig?.name || '平台'} 并登录你的账号
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  2. 按 F12 打开开发者工具 → 切换到 Application（应用）标签
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  3. 左侧选择 Cookies → 找到 {selectedPlatformConfig?.name || '平台'} 域名下的所有 Cookie
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  4. 使用浏览器插件（如 &quot;Get cookies.txt LOCALLY&quot;、&quot;EditThisCookie&quot;）导出 Cookie JSON
                </Paragraph>
                <Paragraph style={{ marginBottom: 0, fontWeight: 500 }}>
                  或使用 Playwright 采集工具导出 storageState JSON 文件，直接上传
                </Paragraph>
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        </div>

        {/* 账号名输入 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>账号名称（选填）</Text>
          <Input
            prefix={<UserOutlined />}
            placeholder="输入在该平台的账号名称（留空将自动识别）"
            value={accountNameInput}
            onChange={e => setAccountNameInput(e.target.value)}
          />
        </div>

        {/* Cookie JSON 输入方式 */}
        <Tabs
          items={[
            {
              key: 'paste',
              label: (
                <span>
                  <CopyOutlined /> 粘贴 JSON
                </span>
              ),
              children: (
                <div>
                  <TextArea
                    rows={10}
                    placeholder={`粘贴 Cookie JSON 数据，支持以下格式：\n\n格式1 - Playwright storageState：\n{\n  "cookies": [\n    { "name": "sessionid", "value": "xxx", "domain": ".douyin.com" }\n  ],\n  "origins": [\n    { "origin": "https://www.douyin.com", "localStorage": [...] }\n  ]\n}\n\n格式2 - 纯 Cookie 数组：\n[\n  { "name": "sessionid", "value": "xxx", "domain": ".douyin.com" }\n]`}
                    value={cookieJson}
                    onChange={e => setCookieJson(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
              ),
            },
            {
              key: 'upload',
              label: (
                <span>
                  <FileTextOutlined /> 上传文件
                </span>
              ),
              children: (
                <div>
                  <Dragger
                    accept=".json,.txt"
                    showUploadList={false}
                    beforeUpload={handleFileUpload}
                    style={{ marginBottom: 16 }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽 JSON 文件到此处</p>
                    <p className="ant-upload-hint">
                      支持 Playwright storageState 导出的 JSON 文件
                    </p>
                  </Dragger>
                  {cookieJson && (
                    <Alert
                      type="success"
                      message="文件已读取"
                      description={`${cookieJson.length} 字符，请点击"导入绑定"按钮`}
                      showIcon
                    />
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* 操作按钮 */}
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setCookieModalVisible(false)}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<ImportOutlined />}
              loading={importing}
              disabled={!cookieJson.trim()}
              onClick={handleCookieImport}
            >
              导入绑定
            </Button>
          </Space>
        </div>
      </Modal>

      {/* ============ Popup 授权弹窗（辅助方式） ============ */}
      <Modal
        title={`扫码登录 ${authSession?.platformName || ''}`}
        open={authModalVisible}
        onCancel={() => {
          setAuthModalVisible(false);
          setPolling(false);
        }}
        footer={null}
        width={480}
      >
        <Alert
          type="warning"
          message="扫码登录方式无法自动获取 Cookie，建议使用 Cookie 导入方式"
          style={{ marginBottom: 16 }}
          showIcon
        />

        <Steps
          current={authStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: '打开登录页' },
            { title: '扫码授权' },
            { title: '确认绑定' },
          ]}
        />

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {authStep === 0 && (
            <div>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={5} style={{ marginBottom: 8 }}>
                点击下方按钮打开 {authSession?.platformName} 登录页
              </Title>
              <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                在新窗口中使用手机扫码完成登录
              </Text>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                size="large"
                onClick={openPopupWindow}
              >
                打开 {authSession?.platformName} 登录页
              </Button>
            </div>
          )}

          {authStep === 1 && (
            <div>
              <LoadingOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} spin />
              <Title level={5} style={{ marginBottom: 8 }}>等待授权完成...</Title>
              <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                请在新窗口中完成 {authSession?.platformName} 的扫码登录
              </Text>

              <div style={{ marginTop: 24, padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  如果系统未自动检测到授权，请在完成扫码后手动确认：
                </Text>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="输入你在该平台的账号名称"
                    value={popupAccountName}
                    onChange={e => setPopupAccountName(e.target.value)}
                    onPressEnter={confirmAuth}
                  />
                  <Button
                    type="primary"
                    onClick={confirmAuth}
                    disabled={!popupAccountName.trim()}
                    block
                  >
                    我已完成授权，确认绑定
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {authStep === 2 && (
            <div>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={5} style={{ color: '#52c41a' }}>授权成功！</Title>
              <Text type="secondary">{authSession?.platformName} 账号已成功绑定</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
