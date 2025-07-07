import React from 'react';
import { Card, Alert, List, Tag, Empty, Divider } from 'antd';
import { 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useAnalysisResult } from '@/stores/appStore';
import type { ErrorDetail } from '@/types/har';

const ErrorsTab: React.FC = () => {
  const analysisResult = useAnalysisResult();

  if (!analysisResult) {
    return <div>暂无数据</div>;
  }

  const { errors } = analysisResult;

  const renderErrorList = (title: string, errorList: ErrorDetail[], icon: React.ReactNode, color: string) => {
    if (errorList.length === 0) {
      return null;
    }

    return (
      <Card 
        title={
          <span>
            {icon}
            <span style={{ marginLeft: 8 }}>{title}</span>
            <Tag color={color} style={{ marginLeft: 8 }}>
              {errorList.length}
            </Tag>
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <List
          size="small"
          dataSource={errorList}
          renderItem={(error, index) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={getMethodColor(error.method)}>{error.method}</Tag>
                    <Tag color={color}>{error.status} {error.statusText}</Tag>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {Math.round(error.responseTime)}ms
                    </span>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4, wordBreak: 'break-all' }}>
                      {error.url}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      发生时间: {error.startTime.toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          pagination={errorList.length > 10 ? {
            pageSize: 10,
            size: 'small',
            showSizeChanger: false
          } : false}
        />
      </Card>
    );
  };

  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      'GET': 'blue',
      'POST': 'green',
      'PUT': 'orange',
      'DELETE': 'red',
      'PATCH': 'purple'
    };
    return colors[method] || 'default';
  };

  // 计算错误统计
  const totalErrors = errors.totalErrors;
  const errorRate = errors.errorRate;

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 错误概览 */}
      <Alert
        message="错误分析概览"
        description={
          <div>
            <p>
              共发现 <strong>{totalErrors}</strong> 个错误，错误率为 <strong>{errorRate.toFixed(2)}%</strong>
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>4xx 客户端错误: <Tag color="orange">{errors.clientErrors.length}</Tag></span>
              <span>5xx 服务器错误: <Tag color="red">{errors.serverErrors.length}</Tag></span>
              <span>网络错误: <Tag color="red">{errors.networkErrors.length}</Tag></span>
            </div>
          </div>
        }
        type={totalErrors > 0 ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 如果没有错误 */}
      {totalErrors === 0 && (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>🎉 太棒了！</div>
                <div>所有请求都成功了，没有发现任何错误</div>
              </div>
            }
          />
        </Card>
      )}

      {/* 客户端错误 (4xx) */}
      {renderErrorList(
        '客户端错误 (4xx)',
        errors.clientErrors,
        <WarningOutlined />,
        'orange'
      )}

      {/* 服务器错误 (5xx) */}
      {renderErrorList(
        '服务器错误 (5xx)',
        errors.serverErrors,
        <CloseCircleOutlined />,
        'red'
      )}

      {/* 网络错误 */}
      {renderErrorList(
        '网络错误',
        errors.networkErrors,
        <BugOutlined />,
        'red'
      )}

      {/* 错误分析和建议 */}
      {totalErrors > 0 && (
        <Card title="错误分析与建议" style={{ marginTop: 16 }}>
          <div>
            <h4>常见错误类型分析:</h4>
            <List size="small">
              {errors.clientErrors.length > 0 && (
                <List.Item>
                  <List.Item.Meta
                    avatar={<WarningOutlined style={{ color: '#faad14' }} />}
                    title="4xx 客户端错误"
                    description="通常由错误的请求格式、无效的URL、权限问题等引起。建议检查请求参数和权限配置。"
                  />
                </List.Item>
              )}
              {errors.serverErrors.length > 0 && (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
                    title="5xx 服务器错误"
                    description="服务器内部错误，可能是代码异常、数据库连接问题或服务器过载。建议检查服务器日志。"
                  />
                </List.Item>
              )}
              {errors.networkErrors.length > 0 && (
                <List.Item>
                  <List.Item.Meta
                    avatar={<BugOutlined style={{ color: '#f5222d' }} />}
                    title="网络错误"
                    description="网络连接问题，可能是DNS解析失败、连接超时或网络不稳定。建议检查网络连接。"
                  />
                </List.Item>
              )}
            </List>

            <Divider />

            <h4>优化建议:</h4>
            <List size="small">
              <List.Item>
                <ExclamationCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                对于高频出现的错误，优先进行修复
              </List.Item>
              <List.Item>
                <ExclamationCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                建立错误监控和告警机制
              </List.Item>
              <List.Item>
                <ExclamationCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                优化错误处理逻辑，提供更友好的错误提示
              </List.Item>
              <List.Item>
                <ExclamationCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                定期检查和更新API文档，确保客户端正确调用
              </List.Item>
            </List>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ErrorsTab;