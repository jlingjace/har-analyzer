import React, { Component, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { BugOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '50px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <Result
            status="error"
            icon={<BugOutlined />}
            title="应用程序出现错误"
            subTitle="抱歉，应用程序遇到了一个意外错误。您可以尝试刷新页面或重置应用状态。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                重置状态
              </Button>
            ]}
          >
            <div style={{ maxWidth: 600 }}>
              <Paragraph>
                <Text strong>错误详情:</Text>
              </Paragraph>
              <Paragraph>
                <Text code>{this.state.error?.message}</Text>
              </Paragraph>
              {process.env.NODE_ENV === 'development' && (
                <details style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>
                  <summary>技术详情 (开发环境)</summary>
                  <pre>
                    {this.state.error?.stack}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;