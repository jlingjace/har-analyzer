import React from 'react';
import { Layout, Typography, Switch, Space, Button } from 'antd';
import { 
  GithubOutlined, 
  BulbOutlined, 
  BulbFilled 
} from '@ant-design/icons';
import { useAppStore, useTheme } from '@/stores/appStore';
import styled from 'styled-components';

const { Header } = Layout;
const { Title } = Typography;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: ${props => props.theme.mode === 'dark' ? '#001529' : '#fff'};
  border-bottom: 1px solid ${props => props.theme.mode === 'dark' ? '#303030' : '#f0f0f0'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AppHeader: React.FC = () => {
  const { setTheme } = useAppStore();
  const theme = useTheme();

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleGithubClick = () => {
    window.open('https://github.com/your-username/har-analyzer', '_blank');
  };

  return (
    <StyledHeader theme={{ mode: theme }}>
      <LogoSection>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#1890ff"/>
          <path 
            d="M8 12h16M8 16h16M8 20h12" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
        <Title level={3} style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#000' }}>
          HAR Analyzer
        </Title>
      </LogoSection>

      <ActionSection>
        <Space>
          <span style={{ color: theme === 'dark' ? '#fff' : '#666' }}>
            主题切换
          </span>
          <Switch
            checked={theme === 'dark'}
            onChange={handleThemeChange}
            checkedChildren={<BulbFilled />}
            unCheckedChildren={<BulbOutlined />}
          />
          
          <Button
            type="text"
            icon={<GithubOutlined />}
            onClick={handleGithubClick}
            style={{ color: theme === 'dark' ? '#fff' : '#666' }}
          >
            GitHub
          </Button>
        </Space>
      </ActionSection>
    </StyledHeader>
  );
};

export default AppHeader;