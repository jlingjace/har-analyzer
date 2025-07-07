import React from 'react';
import { 
  Tabs, 
  Result, 
  Button, 
  PageHeader, 
  Space,
  Tag,
  Descriptions 
} from 'antd';
import { 
  DownloadOutlined, 
  ShareAltOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAnalysisResult, useAppStore } from '@/stores/appStore';
import OverviewTab from '@/components/analysis/OverviewTab';
import PerformanceTab from '@/components/analysis/PerformanceTab';
import RequestsTab from '@/components/analysis/RequestsTab';
import ErrorsTab from '@/components/analysis/ErrorsTab';
import RecommendationsTab from '@/components/analysis/RecommendationsTab';
import styled from 'styled-components';
import filesize from 'filesize';

const AnalysisContainer = styled.div`
  padding: 24px;
  height: 100%;
  overflow: auto;
`;

const StyledPageHeader = styled(PageHeader)`
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const analysisResult = useAnalysisResult();
  const { exportData } = useAppStore();

  if (!analysisResult) {
    return (
      <AnalysisContainer>
        <Result
          status="404"
          title="没有分析数据"
          subTitle="请先上传 HAR 文件进行分析"
          extra={
            <Button type="primary" onClick={() => navigate('/upload')}>
              上传文件
            </Button>
          }
        />
      </AnalysisContainer>
    );
  }

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      await exportData(format);
    } catch (error) {
      // 错误处理已在 store 中完成
    }
  };

  const getRiskLevelTag = (errorRate: number) => {
    if (errorRate > 10) return <Tag color="red">高风险</Tag>;
    if (errorRate > 5) return <Tag color="orange">中风险</Tag>;
    return <Tag color="green">低风险</Tag>;
  };

  const tabItems = [
    {
      key: 'overview',
      label: '总览',
      children: <OverviewTab />
    },
    {
      key: 'performance',
      label: '性能分析',
      children: <PerformanceTab />
    },
    {
      key: 'requests',
      label: '请求详情',
      children: <RequestsTab />
    },
    {
      key: 'errors',
      label: '错误分析',
      children: <ErrorsTab />
    },
    {
      key: 'recommendations',
      label: '优化建议',
      children: <RecommendationsTab />
    }
  ];

  return (
    <AnalysisContainer>
      <StyledPageHeader
        onBack={() => navigate('/upload')}
        title="HAR 分析结果"
        subTitle={
          <Space>
            <FileTextOutlined />
            {analysisResult.fileInfo.fileName}
          </Space>
        }
        tags={[
          getRiskLevelTag(analysisResult.summary.errorRate),
          <Tag icon={<ClockCircleOutlined />} key="time">
            {analysisResult.fileInfo.timeRange.start.toLocaleString()}
          </Tag>
        ]}
        extra={[
          <Button 
            key="pdf" 
            icon={<DownloadOutlined />}
            onClick={() => handleExport('pdf')}
          >
            导出 PDF
          </Button>,
          <Button 
            key="csv" 
            icon={<DownloadOutlined />}
            onClick={() => handleExport('csv')}
          >
            导出 CSV
          </Button>,
          <Button 
            key="json" 
            icon={<DownloadOutlined />}
            onClick={() => handleExport('json')}
          >
            导出 JSON
          </Button>
        ]}
      >
        <Descriptions size="small" column={4}>
          <Descriptions.Item label="文件大小">
            {filesize(analysisResult.fileInfo.fileSize)}
          </Descriptions.Item>
          <Descriptions.Item label="请求总数">
            {analysisResult.summary.totalRequests}
          </Descriptions.Item>
          <Descriptions.Item label="成功请求">
            {analysisResult.summary.successfulRequests}
          </Descriptions.Item>
          <Descriptions.Item label="失败请求">
            {analysisResult.summary.failedRequests}
          </Descriptions.Item>
          <Descriptions.Item label="平均响应时间">
            {Math.round(analysisResult.summary.avgResponseTime)}ms
          </Descriptions.Item>
          <Descriptions.Item label="错误率">
            {analysisResult.summary.errorRate.toFixed(2)}%
          </Descriptions.Item>
          <Descriptions.Item label="传输总量">
            {filesize(analysisResult.summary.totalBytes)}
          </Descriptions.Item>
          <Descriptions.Item label="涉及域名">
            {analysisResult.summary.uniqueDomains} 个
          </Descriptions.Item>
        </Descriptions>
      </StyledPageHeader>

      <Tabs
        items={tabItems}
        size="large"
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}
      />
    </AnalysisContainer>
  );
};

export default AnalysisPage;