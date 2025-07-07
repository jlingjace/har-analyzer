import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Upload, 
  Typography, 
  Alert, 
  Steps, 
  Space, 
  Spin, 
  Result,
  Button,
  message,
  Progress
} from 'antd';
import { 
  InboxOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useLoading, useError } from '@/stores/appStore';
import type { UploadProps } from 'antd';
import styled from 'styled-components';

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const UploadContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const UploadCard = styled(Card)`
  margin-bottom: 24px;
  
  .ant-upload-drag {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #1890ff;
      background: #f0f9ff;
    }
  }
  
  .ant-upload-drag-icon {
    font-size: 48px;
    color: #1890ff;
  }
`;

const HelpCard = styled(Card)`
  margin-top: 24px;
`;

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { analyzeFile } = useAppStore();
  const loading = useLoading();
  const error = useError();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback(async (file: File) => {
    try {
      // 文件大小检查
      if (file.size > 50 * 1024 * 1024) {
        message.error('文件大小不能超过 50MB');
        return false;
      }

      // 文件格式检查
      if (!file.name.toLowerCase().endsWith('.har')) {
        message.error('请上传 .har 格式的文件');
        return false;
      }

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // 分析文件
      await analyzeFile(file);
      
      // 完成进度
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      message.success('文件解析完成！');
      
      // 延迟跳转以显示完成状态
      setTimeout(() => {
        navigate('/analysis');
      }, 1000);

    } catch (err) {
      setUploadProgress(0);
      const errorMessage = err instanceof Error ? err.message : '文件处理失败';
      message.error(errorMessage);
    }

    return false; // 阻止默认上传
  }, [analyzeFile, navigate]);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.har',
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: loading
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <UploadContainer>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin 
              size="large" 
              indicator={<LoadingOutlined spin />}
            />
            <Title level={4} style={{ marginTop: 16 }}>
              正在解析 HAR 文件...
            </Title>
            {uploadProgress > 0 && (
              <Progress 
                percent={uploadProgress} 
                status={uploadProgress === 100 ? 'success' : 'active'}
                style={{ maxWidth: 400, margin: '16px auto' }}
              />
            )}
            <Paragraph type="secondary">
              请稍候，我们正在分析您的网络数据
            </Paragraph>
          </div>
        </Card>
      </UploadContainer>
    );
  }

  return (
    <UploadContainer>
      <UploadCard title={
        <Space>
          <FileTextOutlined />
          上传 HAR 文件
        </Space>
      }>
        {error && (
          <Alert
            message="文件处理失败"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            点击或拖拽 HAR 文件到此区域上传
          </p>
          <p className="ant-upload-hint">
            支持 .har 格式文件，最大 50MB。文件将在本地处理，不会上传到服务器。
          </p>
        </Dragger>
      </UploadCard>

      <HelpCard title="如何获取 HAR 文件？">
        <Steps direction="vertical" size="small">
          <Step
            status="finish"
            title="打开浏览器开发者工具"
            description="在网页中按 F12 键，或右键点击页面选择"检查""
            icon={<CheckCircleOutlined />}
          />
          <Step
            status="finish"
            title="切换到 Network 面板"
            description="在开发者工具中点击 Network（网络）选项卡"
            icon={<CheckCircleOutlined />}
          />
          <Step
            status="finish"
            title="执行需要分析的操作"
            description="刷新页面或执行您想要分析的网络操作"
            icon={<CheckCircleOutlined />}
          />
          <Step
            status="finish"
            title="导出 HAR 文件"
            description="右键点击请求列表，选择"Save all as HAR with content""
            icon={<CheckCircleOutlined />}
          />
        </Steps>

        <Alert
          message="小贴士"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                • HAR 文件包含了完整的网络请求信息，包括响应时间、状态码、请求头等
              </Paragraph>
              <Paragraph style={{ marginBottom: 8 }}>
                • 建议在需要分析的页面操作完成后再导出 HAR 文件
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                • 所有数据处理都在您的浏览器本地进行，保护您的隐私安全
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </HelpCard>
    </UploadContainer>
  );
};

export default UploadPage;