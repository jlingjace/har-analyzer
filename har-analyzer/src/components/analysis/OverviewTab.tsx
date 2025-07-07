import React from 'react';
import { Row, Col, Card, Statistic, List, Badge, Progress, Alert } from 'antd';
import { 
  ApiOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useAnalysisResult } from '@/stores/appStore';
import ResponseTimeChart from '@/components/charts/ResponseTimeChart';
import StatusCodeChart from '@/components/charts/StatusCodeChart';
import DomainChart from '@/components/charts/DomainChart';
import filesize from 'filesize';
import styled from 'styled-components';

const MetricCard = styled(Card)`
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
`;

const ChartCard = styled(Card)`
  margin-bottom: 16px;
  
  .chart-container {
    height: 300px;
  }
`;

const OverviewTab: React.FC = () => {
  const analysisResult = useAnalysisResult();

  if (!analysisResult) {
    return <div>暂无数据</div>;
  }

  const { summary, performance, requests } = analysisResult;

  // 计算性能等级
  const getPerformanceLevel = (avgTime: number) => {
    if (avgTime < 500) return { level: '优秀', color: '#52c41a' };
    if (avgTime < 1000) return { level: '良好', color: '#faad14' };
    if (avgTime < 2000) return { level: '一般', color: '#fa8c16' };
    return { level: '较差', color: '#f5222d' };
  };

  const performanceLevel = getPerformanceLevel(summary.avgResponseTime);

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <MetricCard>
            <Statistic
              title="总请求数"
              value={summary.totalRequests}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </MetricCard>
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard>
            <Statistic
              title="平均响应时间"
              value={Math.round(summary.avgResponseTime)}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: performanceLevel.color }}
            />
            <div style={{ marginTop: 8 }}>
              <Badge color={performanceLevel.color} text={performanceLevel.level} />
            </div>
          </MetricCard>
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard>
            <Statistic
              title="错误率"
              value={summary.errorRate}
              precision={1}
              suffix="%"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: summary.errorRate > 5 ? '#f5222d' : '#52c41a' }}
            />
          </MetricCard>
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard>
            <Statistic
              title="传输总量"
              value={filesize(summary.totalBytes)}
              prefix={<CloudDownloadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </MetricCard>
        </Col>
      </Row>

      {/* 详细指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card title="请求统计" size="small">
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><CheckCircleOutlined style={{ color: '#52c41a' }} /> 成功请求</span>
                <span>{summary.successfulRequests}</span>
              </div>
              <Progress 
                percent={(summary.successfulRequests / summary.totalRequests) * 100} 
                showInfo={false} 
                strokeColor="#52c41a"
                size="small"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><WarningOutlined style={{ color: '#f5222d' }} /> 失败请求</span>
                <span>{summary.failedRequests}</span>
              </div>
              <Progress 
                percent={(summary.failedRequests / summary.totalRequests) * 100} 
                showInfo={false} 
                strokeColor="#f5222d"
                size="small"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card title="响应时间分布" size="small">
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>最小值</span>
                <span>{Math.round(performance.responseTime.min)}ms</span>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>最大值</span>
                <span>{Math.round(performance.responseTime.max)}ms</span>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>P95</span>
                <span>{Math.round(performance.responseTime.p95)}ms</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>P99</span>
                <span>{Math.round(performance.responseTime.p99)}ms</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card title="网络概览" size="small">
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>涉及域名</span>
                <span>{summary.uniqueDomains} 个</span>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>请求方法</span>
                <span>{Object.keys(requests.byMethod).length} 种</span>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>状态码类型</span>
                <span>{Object.keys(requests.byStatus).length} 种</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>内容类型</span>
                <span>{Object.keys(requests.byContentType).length} 种</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <ChartCard title="响应时间趋势">
            <div className="chart-container">
              <ResponseTimeChart />
            </div>
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard title="状态码分布">
            <div className="chart-container">
              <StatusCodeChart />
            </div>
          </ChartCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ChartCard title="域名请求分布">
            <div className="chart-container">
              <DomainChart />
            </div>
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="优化建议" style={{ height: '100%' }}>
            <List
              size="small"
              dataSource={analysisResult.recommendations.slice(0, 5)}
              renderItem={(item, index) => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
                    <span style={{ fontSize: 13, lineHeight: '20px' }}>{item}</span>
                  </div>
                </List.Item>
              )}
            />
            {analysisResult.recommendations.length === 0 && (
              <Alert
                message="性能表现优秀"
                description="当前网络性能表现良好，暂无优化建议"
                type="success"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewTab;