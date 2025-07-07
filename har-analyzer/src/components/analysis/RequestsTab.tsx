import React, { useState } from 'react';
import { Table, Card, Tag, Input, Select, Space, Tooltip, Button } from 'antd';
import { SearchOutlined, LinkOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAnalysisResult } from '@/stores/appStore';
import type { ColumnsType } from 'antd/es/table';
import type { SlowRequest } from '@/types/har';
import { filesize } from 'filesize';

const { Search } = Input;
const { Option } = Select;

interface RequestTableData extends SlowRequest {
  index: number;
}

const RequestsTab: React.FC = () => {
  const analysisResult = useAnalysisResult();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  if (!analysisResult) {
    return <div>暂无数据</div>;
  }

  // 准备表格数据 - 使用慢请求数据作为示例
  const tableData: RequestTableData[] = analysisResult.requests.slowRequests.map((req, index) => ({
    ...req,
    index: index + 1
  }));

  // 过滤数据
  const filteredData = tableData.filter(item => {
    const matchesSearch = searchText === '' || item.url.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toString() === statusFilter;
    const matchesMethod = methodFilter === 'all' || item.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // 获取状态码标签颜色
  const getStatusTagColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400 && status < 500) return 'error';
    if (status >= 500) return 'red';
    return 'default';
  };

  // 获取方法标签颜色
  const getMethodTagColor = (method: string): string => {
    const colors: Record<string, string> = {
      'GET': 'blue',
      'POST': 'green',
      'PUT': 'orange',
      'DELETE': 'red',
      'PATCH': 'purple',
      'HEAD': 'cyan',
      'OPTIONS': 'magenta'
    };
    return colors[method] || 'default';
  };

  const columns: ColumnsType<RequestTableData> = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      fixed: 'left'
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag color={getMethodTagColor(method)}>{method}</Tag>
      ),
      filters: Object.keys(analysisResult.requests.byMethod).map(method => ({
        text: method,
        value: method
      })),
      onFilter: (value, record) => record.method === value
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: {
        showTitle: false
      },
      render: (url: string) => (
        <Tooltip title={url} placement="topLeft">
          <div style={{ maxWidth: 300 }}>
            <LinkOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {url.length > 50 ? `${url.substring(0, 50)}...` : url}
          </div>
        </Tooltip>
      )
    },
    {
      title: '状态码',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={getStatusTagColor(status)}>{status}</Tag>
      ),
      sorter: (a, b) => a.status - b.status,
      filters: Object.keys(analysisResult.requests.byStatus).map(status => ({
        text: status,
        value: status
      })),
      onFilter: (value, record) => record.status.toString() === value
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 120,
      render: (time: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: time > 2000 ? '#f5222d' : '#52c41a' }} />
          <span style={{ color: time > 2000 ? '#f5222d' : 'inherit' }}>
            {Math.round(time)}ms
          </span>
        </Space>
      ),
      sorter: (a, b) => a.responseTime - b.responseTime,
      defaultSortOrder: 'descend'
    },
    {
      title: '响应大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => filesize(size),
      sorter: (a, b) => a.size - b.size
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      render: (time: Date) => time.toLocaleTimeString(),
      sorter: (a, b) => a.startTime.getTime() - b.startTime.getTime()
    }
  ];

  // 获取唯一的状态码选项
  const statusOptions = ['all', ...Object.keys(analysisResult.requests.byStatus)];
  const methodOptions = ['all', ...Object.keys(analysisResult.requests.byMethod)];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 统计卡片 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
              {analysisResult.summary.totalRequests}
            </div>
            <div style={{ color: '#666' }}>总请求数</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
              {analysisResult.summary.successfulRequests}
            </div>
            <div style={{ color: '#666' }}>成功请求</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f5222d' }}>
              {analysisResult.summary.failedRequests}
            </div>
            <div style={{ color: '#666' }}>失败请求</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: '1 1 200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
              {analysisResult.summary.uniqueDomains}
            </div>
            <div style={{ color: '#666' }}>涉及域名</div>
          </div>
        </Card>
      </div>

      {/* 过滤器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索 URL"
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            placeholder="状态码"
          >
            <Option value="all">全部状态码</Option>
            {statusOptions.slice(1).map(status => (
              <Option key={status} value={status}>{status}</Option>
            ))}
          </Select>
          <Select
            value={methodFilter}
            onChange={setMethodFilter}
            style={{ width: 120 }}
            placeholder="请求方法"
          >
            <Option value="all">全部方法</Option>
            {methodOptions.slice(1).map(method => (
              <Option key={method} value={method}>{method}</Option>
            ))}
          </Select>
          <Button 
            onClick={() => {
              setSearchText('');
              setStatusFilter('all');
              setMethodFilter('all');
            }}
          >
            重置筛选
          </Button>
        </Space>
      </Card>

      {/* 请求列表表格 */}
      <Card title={`请求列表 (${filteredData.length} 条记录)`}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="index"
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>
    </div>
  );
};

export default RequestsTab;