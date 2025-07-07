import React from 'react';
import { Card, List, Badge, Alert, Tag, Divider, Space, Typography } from 'antd';
import { 
  BulbOutlined,
  RocketOutlined,
  SecurityScanOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAnalysisResult } from '@/stores/appStore';

const { Title, Paragraph, Text } = Typography;

const RecommendationsTab: React.FC = () => {
  const analysisResult = useAnalysisResult();

  if (!analysisResult) {
    return <div>暂无数据</div>;
  }

  const { recommendations, performance, summary } = analysisResult;

  // 根据分析结果生成分类建议
  const categorizedRecommendations = {
    performance: [] as string[],
    security: [] as string[],
    optimization: [] as string[],
    infrastructure: [] as string[]
  };

  // 简单的关键词分类
  recommendations.forEach(rec => {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes('响应时间') || lowerRec.includes('延迟') || lowerRec.includes('性能')) {
      categorizedRecommendations.performance.push(rec);
    } else if (lowerRec.includes('安全') || lowerRec.includes('https') || lowerRec.includes('ssl')) {
      categorizedRecommendations.security.push(rec);
    } else if (lowerRec.includes('缓存') || lowerRec.includes('压缩') || lowerRec.includes('cdn')) {
      categorizedRecommendations.optimization.push(rec);
    } else {
      categorizedRecommendations.infrastructure.push(rec);
    }
  });

  // 获取优先级
  const getPriority = (avgResponseTime: number, errorRate: number) => {
    if (avgResponseTime > 2000 || errorRate > 10) return 'high';
    if (avgResponseTime > 1000 || errorRate > 5) return 'medium';
    return 'low';
  };

  const priority = getPriority(summary.avgResponseTime, summary.errorRate);
  const priorityConfig = {
    high: { text: '高优先级', color: '#f5222d' },
    medium: { text: '中优先级', color: '#faad14' },
    low: { text: '低优先级', color: '#52c41a' }
  };

  const renderRecommendationCategory = (
    title: string,
    icon: React.ReactNode,
    items: string[],
    color: string
  ) => {
    if (items.length === 0) return null;

    return (
      <Card 
        title={
          <Space>
            {icon}
            <span>{title}</span>
            <Badge count={items.length} style={{ backgroundColor: color }} />
          </Space>
        }
        style={{ marginBottom: 16 }}
        size="small"
      >
        <List
          size="small"
          dataSource={items}
          renderItem={(item, index) => (
            <List.Item>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Badge 
                  count={index + 1} 
                  style={{ backgroundColor: color, fontSize: 12 }}
                />
                <Text>{item}</Text>
              </div>
            </List.Item>
          )}
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 优化优先级概览 */}
      <Alert
        message={
          <Space>
            <span>优化优先级评估:</span>
            <Tag color={priorityConfig[priority].color}>
              {priorityConfig[priority].text}
            </Tag>
          </Space>
        }
        description={
          <div>
            <p>
              基于当前性能指标分析，平均响应时间 <Text strong>{Math.round(summary.avgResponseTime)}ms</Text>，
              错误率 <Text strong>{summary.errorRate.toFixed(2)}%</Text>
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
              <span>性能建议: <Badge count={categorizedRecommendations.performance.length} /></span>
              <span>安全建议: <Badge count={categorizedRecommendations.security.length} /></span>
              <span>优化建议: <Badge count={categorizedRecommendations.optimization.length} /></span>
              <span>基础设施: <Badge count={categorizedRecommendations.infrastructure.length} /></span>
            </div>
          </div>
        }
        type={priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 如果没有建议 */}
      {recommendations.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BulbOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>性能表现优秀！</Title>
            <Paragraph>
              您的网络性能各项指标都表现良好，暂时没有需要优化的地方。
              建议定期监控性能指标，确保持续的良好表现。
            </Paragraph>
          </div>
        </Card>
      )}

      {/* 性能优化建议 */}
      {renderRecommendationCategory(
        '性能优化',
        <RocketOutlined />,
        categorizedRecommendations.performance,
        '#1890ff'
      )}

      {/* 安全相关建议 */}
      {renderRecommendationCategory(
        '安全优化',
        <SecurityScanOutlined />,
        categorizedRecommendations.security,
        '#f5222d'
      )}

      {/* 优化建议 */}
      {renderRecommendationCategory(
        '资源优化',
        <ThunderboltOutlined />,
        categorizedRecommendations.optimization,
        '#52c41a'
      )}

      {/* 基础设施建议 */}
      {renderRecommendationCategory(
        '基础设施',
        <CloudOutlined />,
        categorizedRecommendations.infrastructure,
        '#722ed1'
      )}

      {/* 通用优化建议 */}
      {recommendations.length > 0 && (
        <Card title={
          <Space>
            <SettingOutlined />
            <span>通用优化指南</span>
          </Space>
        }>
          <div>
            <Title level={5}>性能监控最佳实践:</Title>
            <List size="small">
              <List.Item>
                <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                建立性能监控仪表板，实时跟踪关键指标
              </List.Item>
              <List.Item>
                <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                设置性能告警阈值，及时发现性能问题
              </List.Item>
              <List.Item>
                <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                定期进行性能基准测试，对比分析性能变化
              </List.Item>
              <List.Item>
                <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                优化数据库查询，减少不必要的网络请求
              </List.Item>
            </List>

            <Divider />

            <Title level={5}>优化实施建议:</Title>
            <List size="small">
              <List.Item>
                <span style={{ fontWeight: 'bold', color: '#f5222d' }}>高优先级:</span> 
                优先解决响应时间超过2秒和错误率超过5%的问题
              </List.Item>
              <List.Item>
                <span style={{ fontWeight: 'bold', color: '#faad14' }}>中优先级:</span> 
                优化缓存策略、启用压缩、CDN配置等
              </List.Item>
              <List.Item>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>低优先级:</span> 
                代码重构、文档更新、监控完善等
              </List.Item>
            </List>

            <Divider />

            <Alert
              message="实施提醒"
              description="建议按优先级逐步实施优化措施，每次实施后重新测试验证效果。优化是一个持续的过程，需要根据业务发展和用户反馈不断调整。"
              type="info"
              showIcon
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecommendationsTab;