'use client';

import { useState, useEffect, useRef } from 'react';
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
  List,
  Avatar,
} from 'antd';
import {
  EnvironmentOutlined,
  SearchOutlined,
  AimOutlined,
  CarOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  StarOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PoiInfo {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  tel?: string;
  type: string;
  distance?: number;
  rating?: number;
  photos?: string[];
}

interface AddressComponent {
  province: string;
  city: string;
  district: string;
  township?: string;
  street?: string;
  streetNumber?: string;
}

interface GeocoderResult {
  location: { lng: number; lat: number };
  formattedAddress: string;
  addressComponent: AddressComponent;
}

interface FavoriteItem {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  type: string;
  addTime: string;
}

export default function AMapPage() {
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState('生活服务');
  const [pois, setPois] = useState<PoiInfo[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<PoiInfo | null>(null);
  const [poiDetailVisible, setPoiDetailVisible] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [city, setCity] = useState('北京市');
  const [radius, setRadius] = useState(3000);
  const [routeVisible, setRouteVisible] = useState(false);
  const [routeStart, setRouteStart] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [routeType, setRouteType] = useState<'driving' | 'walking' | 'bus' | 'ride'>('driving');
  const [routeResult, setRouteResult] = useState<any>(null);

  const mapRef = useRef<any>(null);

  // 加载高德地图SDK和收藏数据
  useEffect(() => {
    loadMapSDK();
    loadFavorites();
    return () => {};
  }, []);

  const loadMapSDK = async () => {
    try {
      // 从后端获取地图API Key
      const res = await request.get('/amap/config');
      const apiKey = res.data?.apiKey;

      if (!apiKey) {
        console.warn('高德地图API Key未配置，地图功能不可用');
        setMapLoaded(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
      script.async = true;
      script.onload = () => {
        setMapLoaded(true);
        initMap();
        loadMapPlugins();
      };
      script.onerror = () => {
        console.error('地图SDK加载失败');
        setMapLoaded(false);
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('获取地图配置失败:', error);
      setMapLoaded(false);
    }
  };

  const loadMapPlugins = () => {
    if (window.AMap) {
      window.AMap.plugin([
        'AMap.PlaceSearch',
        'AMap.Driving',
        'AMap.Walking',
        'AMap.Riding',
        'AMap.Transfer',
        'AMap.Geocoder',
        'AMap.Autocomplete',
      ], () => {
        console.log('高德地图插件加载完成');
      });
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await request.get('/amap/favorites');
      if (res.data) {
        setFavorites(res.data);
      }
    } catch {
      setFavorites([]);
    }
  };

  const initMap = () => {
    if (!mapRef.current && window.AMap) {
      mapRef.current = new window.AMap.Map('map-container', {
        zoom: 12,
        center: [116.397428, 39.90923],
        viewMode: '2D',
      });
    }
  };

  // 搜索周边地点 — 调用后端API
  const handleSearch = async () => {
    if (!keyword.trim() && !searchType) {
      message.warning('请输入关键词或选择类型');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post('/amap/search', {
        keyword: keyword || searchType,
        city,
        types: searchType,
        radius,
      });

      const poiList: PoiInfo[] = (res.data?.pois || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        location: p.location,
        tel: p.tel,
        type: p.type,
        distance: p.distance,
        rating: p.rating,
        photos: p.photos,
      }));

      setPois(poiList);
      message.success(`找到 ${poiList.length} 个结果`);

      // 在地图上标记
      if (mapLoaded && mapRef.current && window.AMap && poiList.length > 0) {
        mapRef.current.clearMap();
        poiList.forEach((poi, index) => {
          const marker = new window.AMap.Marker({
            position: new window.AMap.LngLat(poi.location.lng, poi.location.lat),
            title: poi.name,
            label: {
              content: `${index + 1}`,
              direction: 'top',
            },
          });
          mapRef.current.add(marker);
        });
        mapRef.current.setFitView();
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || '搜索失败，请稍后重试');
      setPois([]);
    } finally {
      setLoading(false);
    }
  };

  // 查看地点详情 — 调用后端API
  const handleViewDetail = async (poi: PoiInfo) => {
    try {
      const res = await request.get(`/amap/poi/${poi.id}`);
      if (res.data) {
        setSelectedPoi({ ...poi, ...res.data });
      } else {
        setSelectedPoi(poi);
      }
    } catch {
      setSelectedPoi(poi);
    }
    setPoiDetailVisible(true);
  };

  // 添加收藏 — 调用后端API
  const handleAddFavorite = async (poi: PoiInfo) => {
    try {
      const item = {
        poiId: poi.id,
        name: poi.name,
        address: poi.address,
        location: poi.location,
        type: poi.type,
      };
      await request.post('/amap/favorites', item);
      message.success('已添加到收藏');
      loadFavorites();
    } catch {
      message.error('收藏失败');
    }
  };

  // 删除收藏 — 调用后端API
  const handleRemoveFavorite = async (id: string) => {
    try {
      await request.delete(`/amap/favorites/${id}`);
      message.success('已移除收藏');
      loadFavorites();
    } catch {
      message.error('删除失败');
    }
  };

  // 路径规划 — 调用后端API
  const handleRoute = async () => {
    if (!routeStart.trim() || !routeEnd.trim()) {
      message.warning('请输入起点和终点');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post('/amap/route', {
        origin: routeStart,
        destination: routeEnd,
        mode: routeType,
      });

      if (res.data) {
        setRouteResult(res.data);
        message.success('路径规划完成');

        // 在地图上绘制路线
        if (mapLoaded && mapRef.current && window.AMap && res.data.path) {
          mapRef.current.clearMap();
          const path = res.data.path.map((p: any) =>
            new window.AMap.LngLat(p.lng, p.lat)
          );
          const polyline = new window.AMap.Polyline({
            path,
            strokeColor: '#1890ff',
            strokeWeight: 4,
          });
          mapRef.current.add(polyline);
          mapRef.current.setFitView();
        }
      } else {
        message.warning('未找到路线');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || '路径规划失败');
    } finally {
      setLoading(false);
    }
  };

  // 地理编码 — 调用后端API
  const handleGeocode = async (address: string) => {
    if (!address.trim()) {
      message.warning('请输入地址');
      return;
    }

    setLoading(true);
    try {
      const res = await request.post('/amap/geocode', { address });

      if (res.data) {
        const result: GeocoderResult = res.data;

        if (mapLoaded && mapRef.current && window.AMap) {
          mapRef.current.setCenter([result.location.lng, result.location.lat]);
          const marker = new window.AMap.Marker({
            position: new window.AMap.LngLat(result.location.lng, result.location.lat),
            title: result.formattedAddress,
          });
          mapRef.current.add(marker);
        }

        message.success(`地理编码完成: ${result.formattedAddress}`);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || '地理编码失败');
    } finally {
      setLoading(false);
    }
  };

  const searchTypes = [
    { value: '生活服务', label: '生活服务' },
    { value: '餐饮服务', label: '餐饮服务' },
    { value: '购物服务', label: '购物服务' },
    { value: '风景名胜', label: '风景名胜' },
    { value: '商务住宅', label: '商务住宅' },
    { value: '交通设施', label: '交通设施' },
    { value: '医疗保健', label: '医疗保健' },
    { value: '教育培训', label: '教育培训' },
    { value: '金融机构', label: '金融机构' },
    { value: '公司企业', label: '公司企业' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined style={{ color: '#1890ff' }} /> 高德地图 - 地图服务
        </Title>
        <Text type="secondary">周边搜索、地点查询、路径规划、地理编码等地图服务</Text>
      </div>

      <Row gutter={24}>
        {/* 左侧搜索和地图 */}
        <Col span={16}>
          {/* 搜索栏 */}
          <Card style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Select value={searchType} onChange={setSearchType} style={{ width: 140 }}>
                {searchTypes.map(t => (
                  <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
              </Select>
              <Input
                placeholder="输入关键词搜索..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                搜索
              </Button>
            </Space.Compact>
          </Card>

          {/* 地图容器 */}
          <Card
            style={{ marginBottom: 16 }}
            title="地图"
            extra={
              <Space>
                <Button icon={<AimOutlined />} onClick={() => message.info('定位功能')}>定位</Button>
                <Button icon={<AimOutlined />} onClick={() => setRouteVisible(true)}>路线</Button>
              </Space>
            }
          >
            <div
              id="map-container"
              style={{ height: 400, background: '#f0f2f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? (
                <Spin size="large" />
              ) : (
                <Empty
                  description={mapLoaded ? '搜索地点以在地图上显示' : '地图服务（需配置高德Key）'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </Card>

          {/* 搜索结果 */}
          <Card title="搜索结果">
            {pois.length === 0 ? (
              <Empty description="暂无搜索结果，请输入关键词搜索" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={pois}
                renderItem={(poi) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" icon={<EnvironmentOutlined />} onClick={() => handleViewDetail(poi)}>
                        详情
                      </Button>,
                      <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAddFavorite(poi)}>
                        收藏
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          shape="square"
                          size={60}
                          src={poi.photos?.[0]}
                          style={{ backgroundColor: '#1890ff' }}
                          icon={<EnvironmentOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{poi.name}</Text>
                          {poi.distance && <Tag>{poi.distance}米</Tag>}
                          {poi.rating && <Tag color="gold"><StarOutlined /> {poi.rating}</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary"><EnvironmentOutlined /> {poi.address}</Text>
                          {poi.tel && <Text type="secondary"><PhoneOutlined /> {poi.tel}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* 右侧工具和收藏 */}
        <Col span={8}>
          {/* 工具卡片 */}
          <Card style={{ marginBottom: 16 }} title="快捷工具">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.Search
                placeholder="输入地址进行地理编码"
                enterButton="编码"
                onSearch={handleGeocode}
              />
              <Button block icon={<AimOutlined />} onClick={() => setRouteVisible(true)}>
                路径规划
              </Button>
              <Button block icon={<EnvironmentOutlined />} onClick={() => message.info('坐标拾取功能')}>
                坐标拾取
              </Button>
            </Space>
          </Card>

          {/* 收藏夹 */}
          <Card
            title="我的收藏"
            extra={<Text type="secondary">{favorites.length}个地点</Text>}
          >
            {favorites.length === 0 ? (
              <Empty description="暂无收藏地点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={favorites}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFavorite(item.id)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>{item.address}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{item.addTime}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 地点详情弹窗 */}
      <Modal
        title={selectedPoi?.name}
        open={poiDetailVisible}
        onCancel={() => setPoiDetailVisible(false)}
        footer={[
          <Button key="nav" type="primary" icon={<AimOutlined />} onClick={() => {
            message.info('开始导航');
            setPoiDetailVisible(false);
          }}>
            导航
          </Button>,
          <Button key="fav" icon={<StarOutlined />} onClick={() => {
            if (selectedPoi) handleAddFavorite(selectedPoi);
            setPoiDetailVisible(false);
          }}>
            收藏
          </Button>,
          <Button key="close" onClick={() => setPoiDetailVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {selectedPoi && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="名称" span={2}>{selectedPoi.name}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{selectedPoi.address}</Descriptions.Item>
              <Descriptions.Item label="类型">{selectedPoi.type}</Descriptions.Item>
              <Descriptions.Item label="距离">{selectedPoi.distance ? `${selectedPoi.distance}米` : '-'}</Descriptions.Item>
              {selectedPoi.tel && (
                <Descriptions.Item label="电话" span={2}>
                  <Space>
                    <PhoneOutlined />
                    <Text copyable>{selectedPoi.tel}</Text>
                  </Space>
                </Descriptions.Item>
              )}
              {selectedPoi.rating && (
                <Descriptions.Item label="评分">
                  <Space>
                    <Tag color="gold"><StarOutlined /> {selectedPoi.rating}</Tag>
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="坐标">
                {selectedPoi.location.lat.toFixed(6)}, {selectedPoi.location.lng.toFixed(6)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 路径规划弹窗 */}
      <Modal
        title="路径规划"
        open={routeVisible}
        onCancel={() => setRouteVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="出行方式">
            <Select value={routeType} onChange={setRouteType}>
              <Select.Option value="driving"><CarOutlined /> 驾车</Select.Option>
              <Select.Option value="walking"><EnvironmentOutlined /> 步行</Select.Option>
              <Select.Option value="ride"><ClockCircleOutlined /> 骑行</Select.Option>
              <Select.Option value="bus"><AimOutlined /> 公交</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="起点">
            <Input
              placeholder="输入起点地址"
              value={routeStart}
              onChange={e => setRouteStart(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="终点">
            <Input
              placeholder="输入终点地址"
              value={routeEnd}
              onChange={e => setRouteEnd(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block icon={<SearchOutlined />} onClick={handleRoute} loading={loading}>
              规划路线
            </Button>
          </Form.Item>
        </Form>

        {routeResult && (
          <div style={{ marginTop: 16 }}>
            <Card size="small" title="规划结果">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="距离" value={routeResult.distance || '-'} />
                </Col>
                <Col span={12}>
                  <Statistic title="预计时间" value={routeResult.time || '-'} />
                </Col>
              </Row>
              {routeResult.steps && routeResult.steps.length > 0 && (
                <>
                  <Divider />
                  <Title level={5}>导航步骤</Title>
                  <List
                    size="small"
                    dataSource={routeResult.steps}
                    renderItem={(step: any, index: number) => (
                      <List.Item>
                        <Space>
                          <Avatar size="small">{index + 1}</Avatar>
                          <div>
                            <Text>{step.instruction}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>{step.distance}</Text>
                          </div>
                        </Space>
                      </List.Item>
                    )}
                  />
                </>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 声明全局变量
declare global {
  interface Window {
    AMap: any;
  }
}
