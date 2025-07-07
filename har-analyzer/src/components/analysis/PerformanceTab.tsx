import React from 'react';
import { Row, Col, Card, Descriptions, Progress, Statistic, Table } from 'antd';
import { useAnalysisResult } from '@/stores/appStore';
import type { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';
import WaterfallChart from '@/components/charts/WaterfallChart';

const MetricCard = styled(Card)`
  margin-bottom: 16px;
  text-align: center;
  
  .ant-statistic-content {
    font-size: 20px;
  }
`;

const PerformanceTab: React.FC = () => {
  const analysisResult = useAnalysisResult();

  if (!analysisResult) {
    return <div>暂无数据</div>;
  }

  const { performance } = analysisResult;

  // 时序分析数据
  const timingData = [
    {
      key: 'dns',
      phase: 'DNS 解析',
      avg: performance.timing.dns.avg,
      min: performance.timing.dns.min,
      max: performance.timing.dns.max,
      total: performance.timing.dns.total
    },
    {
      key: 'connect',
      phase: '连接建立',
      avg: performance.timing.connect.avg,
      min: performance.timing.connect.min,
      max: performance.timing.connect.max,
      total: performance.timing.connect.total
    },
    {
      key: 'send',
      phase: '发送请求',
      avg: performance.timing.send.avg,
      min: performance.timing.send.min,
      max: performance.timing.send.max,
      total: performance.timing.send.total
    },
    {
      key: 'wait',
      phase: '等待响应',
      avg: performance.timing.wait.avg,
      min: performance.timing.wait.min,
      max: performance.timing.wait.max,
      total: performance.timing.wait.total
    },
    {
      key: 'receive',
      phase: '接收数据',
      avg: performance.timing.receive.avg,
      min: performance.timing.receive.min,
      max: performance.timing.receive.max,
      total: performance.timing.receive.total
    }
  ];

  const timingColumns: ColumnsType<typeof timingData[0]> = [
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 120
    },
    {
      title: '平均时间 (ms)',
      dataIndex: 'avg',
      key: 'avg',
      render: (value: number) => Math.round(value * 100) / 100,
      sorter: (a, b) => a.avg - b.avg
    },
    {
      title: '最小时间 (ms)',
      dataIndex: 'min',
      key: 'min',
      render: (value: number) => Math.round(value * 100) / 100
    },
    {
      title: '最大时间 (ms)',
      dataIndex: 'max',
      key: 'max',
      render: (value: number) => Math.round(value * 100) / 100
    },
    {
      title: '总耗时 (s)',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => (value / 1000).toFixed(2)
    },
    {
      title: '占比',
      dataIndex: 'total',
      key: 'percentage',
      render: (value: number) => {
        const totalTime = timingData.reduce((sum, item) => sum + item.total, 0);
        const percentage = totalTime > 0 ? (value / totalTime) * 100 : 0;
        return (
          <Progress
            percent={percentage}
            size="small"
            format={() => `${percentage.toFixed(1)}%`}
          />
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 响应时间统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <MetricCard>
            <Statistic
              title="平均响应时间"
              value={performance.responseTime.avg}
              precision={1}
              suffix="ms"
              valueStyle={{ color: '#1890ff' }}
            />
          </MetricCard>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <MetricCard>
            <Statistic
              title="中位数"
              value={performance.responseTime.median}
              precision={1}
              suffix="ms"
              valueStyle={{ color: '#52c41a' }}
            />
          </MetricCard>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <MetricCard>
            <Statistic
              title="P95"
              value={performance.responseTime.p95}
              precision={1}
              suffix="ms"
              valueStyle={{ color: '#faad14' }}
            />
          </MetricCard>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <MetricCard>
            <Statistic
              title="P99"
              value={performance.responseTime.p99}
              precision={1}
              suffix="ms"
              valueStyle={{ color: '#f5222d' }}
            />
          </MetricCard>
        </Col>
      </Row>

      {/* 响应时间详情 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="响应时间详细统计">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="最小响应时间">
                {Math.round(performance.responseTime.min * 100) / 100} ms
              </Descriptions.Item>
              <Descriptions.Item label="最大响应时间">
                {Math.round(performance.responseTime.max * 100) / 100} ms
              </Descriptions.Item>
              <Descriptions.Item label="响应时间方差">
                {Math.round(
                  performance.responseTime.distribution.reduce((sum, val, idx) => {
                    const mean = performance.responseTime.avg;
                    return sum + Math.pow(val - mean, 2);
                  }, 0) / performance.responseTime.distribution.length * 100
                ) / 100} ms²
              </Descriptions.Item>
              <Descriptions.Item label="响应时间范围">
                {Math.round((performance.responseTime.max - performance.responseTime.min) * 100) / 100} ms
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 时序分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="网络时序分析">
            <Table
              columns={timingColumns}
              dataSource={timingData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 传输大小统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="请求大小统计" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="平均请求大小">
                {formatBytes(performance.size.request.avg)}
              </Descriptions.Item>
              <Descriptions.Item label="最小请求大小">
                {formatBytes(performance.size.request.min)}
              </Descriptions.Item>
              <Descriptions.Item label="最大请求大小">
                {formatBytes(performance.size.request.max)}
              </Descriptions.Item>
              <Descriptions.Item label="请求总大小">
                {formatBytes(performance.size.request.total)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="响应大小统计" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="平均响应大小">
                {formatBytes(performance.size.response.avg)}
              </Descriptions.Item>
              <Descriptions.Item label="最小响应大小">
                {formatBytes(performance.size.response.min)}
              </Descriptions.Item>
              <Descriptions.Item label="最大响应大小">
                {formatBytes(performance.size.response.max)}
              </Descriptions.Item>
              <Descriptions.Item label="响应总大小">
                {formatBytes(performance.size.response.total)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 请求瀑布图 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <WaterfallChart title="请求时间线瀑布图" height={500} />
        </Col>
      </Row>
    </div>
  );
};

// 工具函数
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default PerformanceTab;