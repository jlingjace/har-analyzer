import React from 'react';
import { 
  Card, 
  List, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Empty, 
  Popconfirm,
  message,
  Descriptions
} from 'antd';
import { 
  DeleteOutlined, 
  FileTextOutlined, 
  ClockCircleOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import type { AnalysisRecord } from '@/types/har';
import { filesize } from 'filesize';
import styled from 'styled-components';

const { Title, Text } = Typography;

const HistoryContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HistoryCard = styled(Card)`
  margin-bottom: 16px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatTag = styled(Tag)`
  margin: 0 4px;
`;

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    getHistoryList, 
    deleteHistoryItem, 
    clearAllHistory, 
    loadFromHistory 
  } = useAppStore();
  
  const history = getHistoryList();

  const handleRemoveItem = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      message.success('记录已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllHistory();
      message.success('历史记录已清空');
    } catch (error) {
      message.error('清空失败');
    }
  };

  const handleLoadRecord = async (id: string) => {
    try {
      await loadFromHistory(id);
      message.success('分析结果已加载，正在跳转...');
      // 加载成功后跳转到分析结果页面
      navigate('/analysis');
    } catch (error) {
      message.error('加载失败，请重新上传 HAR 文件');
    }
  };

  const getRiskLevel = (errorRate: number) => {
    if (errorRate > 10) return { text: '高风险', color: 'red' };
    if (errorRate > 5) return { text: '中风险', color: 'orange' };
    return { text: '低风险', color: 'green' };
  };

  const getPerformanceLevel = (avgTime: number) => {
    if (avgTime < 500) return { text: '优秀', color: 'green' };
    if (avgTime < 1000) return { text: '良好', color: 'blue' };
    if (avgTime < 2000) return { text: '一般', color: 'orange' };
    return { text: '较差', color: 'red' };
  };

  if (history.length === 0) {
    return (
      <HistoryContainer>
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} style={{ color: '#999' }}>暂无历史记录</Title>
                <Text type="secondary">
                  上传并分析 HAR 文件后，分析记录将会显示在这里
                </Text>
              </div>
            }
          >
            <Button type="primary" href="/upload">
              上传 HAR 文件
            </Button>
          </Empty>
        </Card>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>分析历史记录</span>
            <Tag color="blue">{history.length} 条记录</Tag>
          </Space>
        }
        extra={
          <Popconfirm
            title="确定要清空所有历史记录吗？"
            description="此操作无法撤销"
            onConfirm={handleClearAll}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>
              清空记录
            </Button>
          </Popconfirm>
        }
      >
        <List
          dataSource={history}
          renderItem={(record) => {
            const riskLevel = getRiskLevel(record.summary.errorRate);
            const performanceLevel = getPerformanceLevel(record.summary.avgResponseTime);

            return (
              <HistoryCard
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Space>
                      <FileTextOutlined />
                      <Text strong>{record.fileName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {filesize(record.fileSize)}
                      </Text>
                      <Tag color={record.hasFullData ? "green" : "orange"}>
                        {record.hasFullData ? "完整缓存" : "基础缓存"}
                      </Tag>
                      <Tag color="blue">
                        {record.storageLocation === 'indexeddb' ? 'IndexedDB' : 
                         record.storageLocation === 'localstorage' ? 'LocalStorage' : '内存'}
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.analyzedAt.toLocaleString()}
                    </Text>
                  </div>
                }
                actions={[
                  <Button 
                    key="view" 
                    type="primary"
                    icon={<BarChartOutlined />}
                    onClick={() => handleLoadRecord(record.id)}
                  >
                    查看详细分析
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这条记录吗？"
                    onConfirm={() => handleRemoveItem(record.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      type="link" 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <div style={{ marginBottom: 12 }}>
                  <Space wrap>
                    <StatTag color="blue">
                      总请求: {record.summary.totalRequests}
                    </StatTag>
                    <StatTag color="green">
                      成功: {record.summary.successfulRequests}
                    </StatTag>
                    <StatTag color="red">
                      失败: {record.summary.failedRequests}
                    </StatTag>
                    <StatTag color={performanceLevel.color}>
                      性能: {performanceLevel.text}
                    </StatTag>
                    <StatTag color={riskLevel.color}>
                      风险: {riskLevel.text}
                    </StatTag>
                  </Space>
                </div>

                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="平均响应时间">
                    {Math.round(record.summary.avgResponseTime)}ms
                  </Descriptions.Item>
                  <Descriptions.Item label="错误率">
                    {record.summary.errorRate.toFixed(2)}%
                  </Descriptions.Item>
                  <Descriptions.Item label="传输总量">
                    {filesize(record.summary.totalBytes).toString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="涉及域名">
                    {record.summary.uniqueDomains} 个
                  </Descriptions.Item>
                </Descriptions>

                {record.summary.errorRate > 5 && (
                  <div style={{ marginTop: 8 }}>
                    <Tag icon={<ExclamationCircleOutlined />} color="warning" style={{ fontSize: 11 }}>
                      错误率较高，建议重点关注
                    </Tag>
                  </div>
                )}

                {record.summary.avgResponseTime > 2000 && (
                  <div style={{ marginTop: 8 }}>
                    <Tag icon={<ExclamationCircleOutlined />} color="error" style={{ fontSize: 11 }}>
                      响应时间较长，建议优化性能
                    </Tag>
                  </div>
                )}
              </HistoryCard>
            );
          }}
        />
      </Card>
    </HistoryContainer>
  );
};

export default HistoryPage;