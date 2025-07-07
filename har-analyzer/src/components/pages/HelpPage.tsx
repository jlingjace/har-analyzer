import React from 'react';
import { 
  Card, 
  Typography, 
  Steps, 
  Alert, 
  Collapse, 
  Tag, 
  Space,
  Button,
  Divider
} from 'antd';
import { 
  QuestionCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BulbOutlined,
  GithubOutlined,
  MailOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const HelpContainer = styled.div`
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const FeatureCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-card-head-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const CodeBlock = styled.pre`
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.45;
`;

const HelpPage: React.FC = () => {
  const faqItems = [
    {
      key: '1',
      label: '什么是 HAR 文件？',
      children: (
        <div>
          <Paragraph>
            HAR (HTTP Archive) 是一种用于记录 HTTP 请求和响应的文件格式。它包含了完整的网络交互信息，
            包括请求头、响应头、时间信息、状态码等详细数据。
          </Paragraph>
          <Paragraph>
            HAR 文件通常由浏览器开发者工具生成，用于网络性能分析、调试和监控。
          </Paragraph>
        </div>
      )
    },
    {
      key: '2',
      label: '如何获取 HAR 文件？',
      children: (
        <Steps direction="vertical" size="small">
          <Step title="打开开发者工具" description="在浏览器中按 F12 或右键选择'检查'" />
          <Step title="切换到 Network 面板" description="点击 Network（网络）选项卡" />
          <Step title="刷新页面或执行操作" description="执行您想要分析的网络操作" />
          <Step title="导出 HAR 文件" description="右键点击请求列表，选择'Save all as HAR with content'" />
        </Steps>
      )
    },
    {
      key: '3',
      label: '支持的文件大小限制是多少？',
      children: (
        <div>
          <Paragraph>
            当前版本支持最大 <Text strong>50MB</Text> 的 HAR 文件。这个大小足以处理大部分网站的网络请求记录。
          </Paragraph>
          <Paragraph>
            如果您的文件超过限制，建议：
          </Paragraph>
          <ul>
            <li>在较短时间窗口内记录网络活动</li>
            <li>关闭"Save all as HAR with content"中的内容保存选项</li>
            <li>分多次记录和分析</li>
          </ul>
        </div>
      )
    },
    {
      key: '4',
      label: '数据安全性如何保障？',
      children: (
        <div>
          <Alert
            message="数据完全本地处理"
            description="所有 HAR 文件的解析和分析都在您的浏览器本地进行，不会上传到任何服务器。您的数据隐私得到完全保护。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Paragraph>
            <Text strong>隐私保护措施：</Text>
          </Paragraph>
          <ul>
            <li>文件不上传到服务器</li>
            <li>分析在浏览器本地执行</li>
            <li>分析结果只存储在本地浏览器</li>
            <li>关闭页面后数据自动清除</li>
          </ul>
        </div>
      )
    },
    {
      key: '5',
      label: '分析结果包含哪些内容？',
      children: (
        <div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Tag color="blue">总览</Tag>
              <span>关键性能指标概览，包括请求统计、响应时间、错误率等</span>
            </div>
            <div>
              <Tag color="green">性能分析</Tag>
              <span>详细的响应时间分析、网络时序分析、传输大小统计</span>
            </div>
            <div>
              <Tag color="orange">请求详情</Tag>
              <span>所有网络请求的详细信息，支持筛选和排序</span>
            </div>
            <div>
              <Tag color="red">错误分析</Tag>
              <span>4xx、5xx 错误的详细分析和分类</span>
            </div>
            <div>
              <Tag color="purple">优化建议</Tag>
              <span>基于分析结果的智能优化建议</span>
            </div>
          </Space>
        </div>
      )
    },
    {
      key: '6',
      label: '如何导出分析报告？',
      children: (
        <div>
          <Paragraph>
            支持多种格式的报告导出：
          </Paragraph>
          <ul>
            <li><Text strong>PDF 报告：</Text>包含完整的分析结果和图表，适合分享和存档</li>
            <li><Text strong>CSV 数据：</Text>详细的请求数据表格，适合进一步分析</li>
            <li><Text strong>JSON 数据：</Text>完整的分析结果数据，适合程序化处理</li>
          </ul>
          <Paragraph>
            在分析结果页面的右上角点击相应的导出按钮即可下载。
          </Paragraph>
        </div>
      )
    }
  ];

  return (
    <HelpContainer>
      <Card
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>使用帮助</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Paragraph>
          HAR Analyzer 是一个专业的网络性能分析工具，帮助您深入了解网站的网络性能表现。
          本工具完全在浏览器本地运行，保护您的数据隐私安全。
        </Paragraph>
      </Card>

      {/* 快速开始 */}
      <FeatureCard
        title={
          <>
            <FileTextOutlined />
            <span>快速开始</span>
          </>
        }
      >
        <Steps>
          <Step 
            title="获取 HAR 文件" 
            description="从浏览器开发者工具导出网络请求记录"
            icon={<FileTextOutlined />}
          />
          <Step 
            title="上传文件" 
            description="将 HAR 文件拖拽到上传区域或点击选择文件"
            icon={<BulbOutlined />}
          />
          <Step 
            title="查看分析" 
            description="自动解析完成后查看详细的性能分析报告"
            icon={<BarChartOutlined />}
          />
        </Steps>
      </FeatureCard>

      {/* 核心功能 */}
      <FeatureCard
        title={
          <>
            <BarChartOutlined />
            <span>核心功能</span>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <Card size="small" type="inner">
            <Title level={5}>性能分析</Title>
            <ul>
              <li>响应时间统计（平均值、P95、P99）</li>
              <li>网络时序分析（DNS、连接、传输）</li>
              <li>请求大小和传输量分析</li>
              <li>性能瓶颈识别</li>
            </ul>
          </Card>
          
          <Card size="small" type="inner">
            <Title level={5}>错误分析</Title>
            <ul>
              <li>HTTP 状态码分布统计</li>
              <li>4xx 客户端错误分析</li>
              <li>5xx 服务器错误分析</li>
              <li>网络连接错误识别</li>
            </ul>
          </Card>
          
          <Card size="small" type="inner">
            <Title level={5}>可视化展示</Title>
            <ul>
              <li>响应时间趋势图</li>
              <li>状态码分布饼图</li>
              <li>域名请求分布图</li>
              <li>交互式数据图表</li>
            </ul>
          </Card>
          
          <Card size="small" type="inner">
            <Title level={5}>智能建议</Title>
            <ul>
              <li>性能优化建议</li>
              <li>缓存策略建议</li>
              <li>网络配置优化</li>
              <li>最佳实践指导</li>
            </ul>
          </Card>
        </div>
      </FeatureCard>

      {/* 常见问题 */}
      <FeatureCard
        title={
          <>
            <QuestionCircleOutlined />
            <span>常见问题</span>
          </>
        }
      >
        <Collapse items={faqItems} />
      </FeatureCard>

      {/* 技术支持 */}
      <FeatureCard
        title={
          <>
            <MailOutlined />
            <span>技术支持</span>
          </>
        }
      >
        <div>
          <Paragraph>
            如果您在使用过程中遇到问题或有建议，欢迎通过以下方式联系我们：
          </Paragraph>
          
          <Space wrap>
            <Button 
              icon={<GithubOutlined />} 
              href="https://github.com/jlingjace/har-analyzer" 
              target="_blank"
            >
              GitHub 项目
            </Button>
            <Button 
              icon={<GithubOutlined />} 
              href="https://github.com/jlingjace/har-analyzer/issues" 
              target="_blank"
            >
              问题反馈
            </Button>
          </Space>

          <Divider />

          <Alert
            message="开源项目"
            description={
              <div>
                <Paragraph>
                  HAR Analyzer 是一个开源项目，基于 MIT 许可证发布。
                  欢迎贡献代码、报告问题或提出改进建议。
                </Paragraph>
                <CodeBlock>
                  {`# 克隆项目
git clone https://github.com/jlingjace/har-analyzer.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev`}
                </CodeBlock>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      </FeatureCard>
    </HelpContainer>
  );
};

export default HelpPage;