import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Divider,
  Alert,
  Statistic,
  Row,
  Col,
  Typography,
  Tag,
  message,
  Modal,
  Progress
} from 'antd';
import {
  SettingOutlined,
  DatabaseOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import type { StorageConfig } from '@/utils/storageManager';
import { filesize } from 'filesize';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StatsCard = styled(Card)`
  .ant-statistic-content {
    color: #1890ff;
  }
`;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    getStorageConfig,
    updateStorageConfig,
    getStorageStats,
    clearAllHistory
  } = useAppStore();

  // 加载存储配置和统计信息
  useEffect(() => {
    loadSettings();
    loadStorageStats();
  }, []);

  const loadSettings = () => {
    const config = getStorageConfig();
    form.setFieldsValue(config);
  };

  const loadStorageStats = async () => {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const handleSaveSettings = async (values: StorageConfig) => {
    try {
      setLoading(true);
      updateStorageConfig(values);
      message.success('设置已保存');
      await loadStorageStats(); // 重新加载统计信息
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = () => {
    Modal.confirm({
      title: '确定要清空所有数据吗？',
      content: '此操作将删除所有历史记录和缓存数据，无法撤销。',
      icon: <ExclamationCircleOutlined />,
      okText: '确定清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setClearLoading(true);
          await clearAllHistory();
          await loadStorageStats();
          message.success('所有数据已清空');
        } catch (error) {
          message.error('清空失败');
        } finally {
          setClearLoading(false);
        }
      }
    });
  };

  const getStorageUsageColor = () => {
    if (!storageStats) return '#1890ff';
    const usagePercent = (storageStats.totalSize / (form.getFieldValue('maxCacheSize') * 1024 * 1024)) * 100;
    if (usagePercent > 80) return '#ff4d4f';
    if (usagePercent > 60) return '#faad14';
    return '#52c41a';
  };

  const getStorageUsagePercent = () => {
    if (!storageStats) return 0;
    const maxSize = form.getFieldValue('maxCacheSize') * 1024 * 1024;
    return Math.min((storageStats.totalSize / maxSize) * 100, 100);
  };

  return (
    <SettingsContainer>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>存储设置</span>
          </Space>
        }
        extra={
          <Button
            type="link"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '简化设置' : '高级设置'}
          </Button>
        }
      >
        {/* 存储统计信息 */}
        {storageStats && (
          <div style={{ marginBottom: 32 }}>
            <Title level={4}>
              <DatabaseOutlined style={{ marginRight: 8 }} />
              存储统计
            </Title>
            
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={8} md={6}>
                <StatsCard size="small">
                  <Statistic
                    title="历史记录数"
                    value={storageStats.itemCount}
                    suffix="条"
                  />
                </StatsCard>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <StatsCard size="small">
                  <Statistic
                    title="总存储大小"
                    value={filesize(storageStats.totalSize || 0).toString()}
                  />
                </StatsCard>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <StatsCard size="small">
                  <Statistic
                    title="内存缓存"
                    value={storageStats.memoryCount}
                    suffix="项"
                  />
                </StatsCard>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <StatsCard size="small">
                  <Statistic
                    title="持久存储"
                    value={storageStats.indexedDBCount + storageStats.localStorageCount}
                    suffix="项"
                  />
                </StatsCard>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <Text strong>存储空间使用情况：</Text>
              <Progress
                percent={getStorageUsagePercent()}
                strokeColor={getStorageUsageColor()}
                format={() => `${filesize(storageStats.totalSize || 0)} / ${form.getFieldValue('maxCacheSize')}MB`}
              />
            </div>

            <Space wrap>
              <Tag color="green">IndexedDB: {storageStats.indexedDBCount} 项</Tag>
              <Tag color="blue">LocalStorage: {storageStats.localStorageCount} 项</Tag>
              <Tag color="orange">内存: {storageStats.memoryCount} 项</Tag>
            </Space>
          </div>
        )}

        <Divider />

        {/* 设置表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSettings}
          initialValues={{
            maxCacheSize: 100,
            maxHistoryCount: 50,
            compressionEnabled: true,
            preferredStorage: 'indexeddb',
            autoCleanup: true
          }}
        >
          <Title level={4}>基础设置</Title>
          
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="最大缓存大小"
                name="maxCacheSize"
                tooltip="设置存储空间的最大限制，单位为MB"
                rules={[
                  { required: true, message: '请输入最大缓存大小' },
                  { type: 'number', min: 10, max: 1000, message: '缓存大小应在10-1000MB之间' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={10}
                  max={1000}
                  step={10}
                  addonAfter="MB"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="最大历史记录数"
                name="maxHistoryCount"
                tooltip="设置保留的历史记录数量上限"
                rules={[
                  { required: true, message: '请输入最大历史记录数' },
                  { type: 'number', min: 10, max: 500, message: '记录数应在10-500之间' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={10}
                  max={500}
                  step={5}
                  addonAfter="条"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="优先存储方式"
                name="preferredStorage"
                tooltip="选择数据的优先存储位置"
              >
                <Select>
                  <Option value="indexeddb">IndexedDB (推荐)</Option>
                  <Option value="localstorage">LocalStorage</Option>
                  <Option value="memory">内存</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="启用数据压缩"
                name="compressionEnabled"
                valuePropName="checked"
                tooltip="压缩数据可以减少存储空间占用，但会增加CPU开销"
              >
                <Switch />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                label="自动清理过期数据"
                name="autoCleanup"
                valuePropName="checked"
                tooltip="自动删除较少使用的数据以释放空间"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          {showAdvanced && (
            <>
              <Divider />
              <Title level={4}>高级设置</Title>
              
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="高级设置"
                description="这些设置会影响系统性能和存储行为，请谨慎修改"
                style={{ marginBottom: 16 }}
              />

              <Text type="secondary">
                注意：修改高级设置可能影响应用性能，建议仅在了解其影响时进行调整。
              </Text>
            </>
          )}

          <Divider />

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SettingOutlined />}
            >
              保存设置
            </Button>
            
            <Button
              onClick={loadSettings}
            >
              重置
            </Button>
            
            <Button
              danger
              onClick={handleClearAllData}
              loading={clearLoading}
              icon={<ClearOutlined />}
            >
              清空所有数据
            </Button>
          </Space>
        </Form>
      </Card>
    </SettingsContainer>
  );
};

export default SettingsPage;