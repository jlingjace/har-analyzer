import React from 'react';
import { Layout, Menu, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useAppStore, useAnalysisResult } from '@/stores/appStore';
import styled from 'styled-components';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  background: ${props => props.theme === 'dark' ? '#001529' : '#fff'};
  border-right: 1px solid ${props => props.theme === 'dark' ? '#303030' : '#f0f0f0'};
  
  .ant-menu {
    border-right: none;
  }
`;

const AppSider: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, getHistoryList } = useAppStore();
  const analysisResult = useAnalysisResult();
  const history = getHistoryList();

  const menuItems = [
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: '文件上传',
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: (
        <span>
          分析结果
          {analysisResult && (
            <Badge 
              count="1" 
              size="small" 
              style={{ marginLeft: 8 }} 
            />
          )}
        </span>
      ),
      disabled: !analysisResult,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: (
        <span>
          历史记录
          {history.length > 0 && (
            <Badge 
              count={history.length} 
              size="small" 
              style={{ marginLeft: 8 }} 
              overflowCount={99}
            />
          )}
        </span>
      ),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '存储设置',
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: '使用帮助',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <StyledSider 
      width={250} 
      theme={theme}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          height: '100%',
          borderRight: 0,
        }}
      />
    </StyledSider>
  );
};

export default AppSider;