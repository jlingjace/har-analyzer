import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme as antdTheme } from 'antd';
import { useTheme } from '@/stores/appStore';
import AppHeader from '@/components/layout/AppHeader';
import AppSider from '@/components/layout/AppSider';
import UploadPage from '@/components/pages/UploadPage';
import AnalysisPage from '@/components/pages/AnalysisPage';
import HistoryPage from '@/components/pages/HistoryPage';
import SettingsPage from '@/components/pages/SettingsPage';
import HelpPage from '@/components/pages/HelpPage';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const { Content } = Layout;

const App: React.FC = () => {
  const theme = useTheme();
  const { defaultAlgorithm, darkAlgorithm } = antdTheme;

  useEffect(() => {
    // 设置页面标题
    document.title = 'HAR Analyzer - 网络性能分析工具';
    
    // 设置主题类名
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          wireframe: false,
        },
      }}
    >
      <ErrorBoundary>
        <Layout className="app-layout" style={{ minHeight: '100vh' }}>
          <AppHeader />
          <Layout>
            <AppSider />
            <Content className="app-content">
              <Routes>
                <Route path="/" element={<Navigate to="/upload" replace />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={<Navigate to="/upload" replace />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App;