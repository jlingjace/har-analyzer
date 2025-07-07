# HAR Analyzer - 纯前端网络性能分析工具

## 1. 产品概述

### 1.1 产品定位

HAR Analyzer 是一个纯前端的网络性能分析工具，专注于解析和可视化 HAR (HTTP Archive) 文件。无需后端服务器，直接在浏览器中运行，为开发者和测试人员提供快速、便捷的网络性能分析能力。

### 1.2 核心价值

- **隐私安全**：数据不上传服务器，完全本地处理
- **即开即用**：无需安装，浏览器直接访问
- **专业分析**：深度解析 HTTP 请求性能指标
- **直观展示**：丰富的图表和可视化效果
- **完全免费**：开源项目，无使用限制

### 1.3 目标用户

- **前端开发者**：分析网页加载性能
- **测试工程师**：检测 API 响应时间
- **运维人员**：诊断网络请求问题
- **产品经理**：了解用户体验指标

## 2. 功能设计

### 2.1 核心功能

#### 2.1.1 文件处理
- **文件上传**：拖拽或点击上传 HAR 文件
- **格式验证**：自动检测和验证 HAR 文件格式
- **文件预览**：显示文件基本信息（大小、条目数量等）
- **错误处理**：友好的错误提示和解决建议

#### 2.1.2 数据解析
- **JSON 解析**：解析 HAR 文件的 JSON 结构
- **数据提取**：提取请求/响应时间、状态码、URL 等关键信息
- **数据清洗**：过滤无效数据，处理异常值
- **实时处理**：使用 Web Workers 避免 UI 阻塞

#### 2.1.3 性能分析
- **响应时间分析**：平均值、中位数、P95、P99 等统计
- **状态码分布**：HTTP 状态码统计和分类
- **请求大小分析**：请求和响应大小统计
- **时序分析**：DNS、连接、发送、等待、接收时间分解
- **慢请求识别**：自动标记异常慢的请求
- **错误率计算**：4xx、5xx 错误统计

#### 2.1.4 数据可视化
- **总览仪表板**：关键指标一览
- **响应时间图表**：时间线图、分布图
- **状态码饼图**：直观的状态码分布
- **瀑布图**：请求时序瀑布图
- **性能趋势图**：时间序列性能变化
- **TOP 慢请求列表**：性能问题定位

#### 2.1.5 报告功能
- **性能报告**：自动生成性能分析报告
- **PDF 导出**：生成 PDF 格式报告
- **数据导出**：导出 CSV 格式原始数据
- **报告分享**：生成分享链接（可选功能）

### 2.2 辅助功能

#### 2.2.1 数据管理
- **本地存储**：分析历史记录本地保存
- **数据对比**：多个 HAR 文件对比分析
- **收藏夹**：标记重要的分析结果
- **批量处理**：同时处理多个 HAR 文件

#### 2.2.2 用户体验
- **响应式设计**：支持桌面和移动端
- **主题切换**：明暗主题支持
- **快捷键**：常用操作快捷键
- **帮助文档**：内置使用指南

## 3. 技术架构

### 3.1 技术栈选择

#### 3.1.1 核心框架
```typescript
// 技术栈
React 18.2+              // UI 框架
TypeScript 5.0+          // 类型安全
Vite 4.0+               // 构建工具
Zustand                 // 状态管理（轻量级）
React Router 6          // 路由管理
```

#### 3.1.2 UI 组件
```typescript
// UI 库
Ant Design 5.0+         // 组件库
Styled Components       // CSS-in-JS
Framer Motion          // 动画库
React Beautiful DND    // 拖拽功能
```

#### 3.1.3 数据处理
```typescript
// 数据处理
Lodash                 // 工具函数
Date-fns              // 日期处理
PapaParse             // CSV 解析
Fuse.js               // 模糊搜索
```

#### 3.1.4 可视化
```typescript
// 图表库
ECharts 5.0+          // 主要图表库
React-ECharts         // React 封装
D3.js 7.0+           // 自定义可视化
React-Virtualized    // 大列表虚拟化
```

#### 3.1.5 文件处理
```typescript
// 文件和导出
jsPDF                 // PDF 生成
xlsx                  // Excel 导出
File API              // 文件读取
Web Workers           // 后台处理
```

### 3.2 项目结构

```
har-analyzer/
├── public/                 # 静态资源
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/         # UI 组件
│   │   ├── common/        # 通用组件
│   │   ├── charts/        # 图表组件
│   │   ├── upload/        # 上传组件
│   │   └── analysis/      # 分析组件
│   ├── hooks/             # 自定义 Hooks
│   ├── stores/            # 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   │   ├── har-parser.ts  # HAR 解析器
│   │   ├── analytics.ts   # 分析算法
│   │   └── export.ts      # 导出功能
│   ├── workers/           # Web Workers
│   └── styles/            # 样式文件
├── tests/                 # 测试文件
└── docs/                  # 文档
```

### 3.3 核心模块设计

#### 3.3.1 HAR 解析器
```typescript
// HAR 解析器接口
interface HARParser {
  parse(file: File): Promise<HARData>;
  validate(harContent: any): ValidationResult;
  extract(harData: HARData): ExtractedData;
}

// HAR 数据类型
interface HARData {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    entries: HAREntry[];
  };
}

interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Header[];
    queryString: QueryParam[];
    postData?: PostData;
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Header[];
    content: Content;
    headersSize: number;
    bodySize: number;
  };
  cache: Cache;
  timings: {
    dns: number;
    connect: number;
    blocked: number;
    send: number;
    wait: number;
    receive: number;
  };
}

// 解析器实现
export class HARParserImpl implements HARParser {
  async parse(file: File): Promise<HARData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const harData = JSON.parse(content);
          
          const validation = this.validate(harData);
          if (!validation.isValid) {
            reject(new Error(`无效的 HAR 文件: ${validation.errors.join(', ')}`));
            return;
          }
          
          resolve(harData);
        } catch (error) {
          reject(new Error(`解析失败: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsText(file);
    });
  }

  validate(harContent: any): ValidationResult {
    const errors: string[] = [];
    
    if (!harContent.log) {
      errors.push('缺少 log 字段');
    }
    
    if (!Array.isArray(harContent.log?.entries)) {
      errors.push('entries 必须是数组');
    }
    
    if (harContent.log?.entries?.length === 0) {
      errors.push('HAR 文件为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  extract(harData: HARData): ExtractedData {
    const entries = harData.log.entries;
    
    return {
      totalRequests: entries.length,
      timeRange: {
        start: new Date(Math.min(...entries.map(e => new Date(e.startedDateTime).getTime()))),
        end: new Date(Math.max(...entries.map(e => new Date(e.startedDateTime).getTime() + e.time)))
      },
      domains: [...new Set(entries.map(e => new URL(e.request.url).hostname))],
      methods: [...new Set(entries.map(e => e.request.method))],
      statusCodes: [...new Set(entries.map(e => e.response.status))],
      contentTypes: [...new Set(entries.map(e => 
        e.response.content.mimeType || 'unknown'
      ))]
    };
  }
}
```

#### 3.3.2 性能分析器
```typescript
// 性能分析器
export class PerformanceAnalyzer {
  analyze(entries: HAREntry[]): PerformanceMetrics {
    const responseTimes = entries.map(e => e.time).filter(t => t >= 0);
    const sizes = entries.map(e => e.response.bodySize).filter(s => s >= 0);
    const statusCodes = entries.map(e => e.response.status);
    
    return {
      // 响应时间统计
      responseTime: {
        average: this.average(responseTimes),
        median: this.median(responseTimes),
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99)
      },
      
      // 请求统计
      requests: {
        total: entries.length,
        successful: statusCodes.filter(s => s >= 200 && s < 300).length,
        redirects: statusCodes.filter(s => s >= 300 && s < 400).length,
        clientErrors: statusCodes.filter(s => s >= 400 && s < 500).length,
        serverErrors: statusCodes.filter(s => s >= 500).length
      },
      
      // 大小统计
      size: {
        totalBytes: sizes.reduce((sum, size) => sum + size, 0),
        averageSize: this.average(sizes),
        largestResponse: Math.max(...sizes)
      },
      
      // 时序分析
      timings: this.analyzeTimings(entries),
      
      // 慢请求
      slowRequests: this.identifySlowRequests(entries),
      
      // 建议
      recommendations: this.generateRecommendations(entries)
    };
  }

  private analyzeTimings(entries: HAREntry[]): TimingAnalysis {
    const timings = entries.map(e => e.timings);
    
    return {
      dns: {
        average: this.average(timings.map(t => t.dns).filter(d => d >= 0)),
        max: Math.max(...timings.map(t => t.dns).filter(d => d >= 0))
      },
      connect: {
        average: this.average(timings.map(t => t.connect).filter(c => c >= 0)),
        max: Math.max(...timings.map(t => t.connect).filter(c => c >= 0))
      },
      send: {
        average: this.average(timings.map(t => t.send)),
        max: Math.max(...timings.map(t => t.send))
      },
      wait: {
        average: this.average(timings.map(t => t.wait)),
        max: Math.max(...timings.map(t => t.wait))
      },
      receive: {
        average: this.average(timings.map(t => t.receive)),
        max: Math.max(...timings.map(t => t.receive))
      }
    };
  }

  private identifySlowRequests(entries: HAREntry[], threshold: number = 2000): SlowRequest[] {
    return entries
      .filter(e => e.time > threshold)
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)
      .map(e => ({
        url: e.request.url,
        method: e.request.method,
        responseTime: e.time,
        status: e.response.status,
        size: e.response.bodySize,
        startedDateTime: e.startedDateTime
      }));
  }

  private generateRecommendations(entries: HAREntry[]): string[] {
    const recommendations: string[] = [];
    const responseTimes = entries.map(e => e.time);
    const avgResponseTime = this.average(responseTimes);
    const errorRate = this.calculateErrorRate(entries);
    
    if (avgResponseTime > 1000) {
      recommendations.push('平均响应时间超过1秒，建议优化服务器性能或使用CDN');
    }
    
    if (errorRate > 5) {
      recommendations.push(`错误率为 ${errorRate.toFixed(1)}%，建议检查服务器日志和错误处理`);
    }
    
    const largeResponses = entries.filter(e => e.response.bodySize > 1024 * 1024);
    if (largeResponses.length > 0) {
      recommendations.push(`发现 ${largeResponses.length} 个大于1MB的响应，建议启用Gzip压缩`);
    }
    
    const slowDns = entries.filter(e => e.timings.dns > 100);
    if (slowDns.length > entries.length * 0.2) {
      recommendations.push('DNS解析时间较长，建议使用更快的DNS服务器或DNS预解析');
    }
    
    const nonCachedRequests = entries.filter(e => 
      !e.response.headers.some(h => h.name.toLowerCase() === 'cache-control')
    );
    if (nonCachedRequests.length > entries.length * 0.5) {
      recommendations.push('大量请求缺少缓存头，建议配置适当的缓存策略');
    }
    
    return recommendations.length > 0 ? recommendations : ['性能表现良好，无明显优化建议'];
  }

  // 工具方法
  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateErrorRate(entries: HAREntry[]): number {
    const errorCount = entries.filter(e => e.response.status >= 400).length;
    return entries.length > 0 ? (errorCount / entries.length) * 100 : 0;
  }
}
```

#### 3.3.3 图表生成器
```typescript
// 图表配置生成器
export class ChartGenerator {
  generateResponseTimeChart(metrics: PerformanceMetrics): EChartsOption {
    return {
      title: {
        text: '响应时间分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}ms'
      },
      xAxis: {
        type: 'category',
        name: '请求序号',
        data: Array.from({ length: metrics.requests.total }, (_, i) => i + 1)
      },
      yAxis: {
        type: 'value',
        name: '响应时间 (ms)',
        axisLabel: {
          formatter: '{value}ms'
        }
      },
      series: [{
        name: '响应时间',
        type: 'line',
        smooth: true,
        data: metrics.responseTimeData, // 需要从原始数据提取
        markLine: {
          data: [
            { yAxis: metrics.responseTime.average, name: '平均值' },
            { yAxis: metrics.responseTime.p95, name: 'P95' }
          ]
        }
      }]
    };
  }

  generateStatusCodeChart(statusDistribution: Record<string, number>): EChartsOption {
    const data = Object.entries(statusDistribution).map(([status, count]) => ({
      name: `${status} (${this.getStatusText(parseInt(status))})`,
      value: count,
      itemStyle: {
        color: this.getStatusColor(parseInt(status))
      }
    }));

    return {
      title: {
        text: '状态码分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        name: '状态码',
        type: 'pie',
        radius: '50%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }

  generateWaterfallChart(entries: HAREntry[]): EChartsOption {
    // 瀑布图实现
    const data = entries.slice(0, 50).map((entry, index) => {
      const start = new Date(entry.startedDateTime).getTime();
      const timings = entry.timings;
      
      return [
        index,
        start,
        start + timings.dns,
        start + timings.dns + timings.connect,
        start + timings.dns + timings.connect + timings.send,
        start + timings.dns + timings.connect + timings.send + timings.wait,
        start + timings.dns + timings.connect + timings.send + timings.wait + timings.receive,
        entry.request.url.split('/').pop() || 'Unknown'
      ];
    });

    return {
      title: {
        text: '请求瀑布图',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '20%',
        right: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        name: '时间'
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d[7])
      },
      series: [{
        name: '请求时序',
        type: 'custom',
        renderItem: this.renderWaterfallItem,
        data
      }]
    };
  }

  private getStatusColor(status: number): string {
    if (status < 300) return '#52c41a';
    if (status < 400) return '#faad14';
    if (status < 500) return '#fa8c16';
    return '#f5222d';
  }

  private getStatusText(status: number): string {
    if (status < 300) return '成功';
    if (status < 400) return '重定向';
    if (status < 500) return '客户端错误';
    return '服务器错误';
  }

  private renderWaterfallItem(params: any, api: any): any {
    // 瀑布图自定义渲染逻辑
    const categoryIndex = api.value(0);
    const start = api.coord([api.value(1), categoryIndex]);
    const end = api.coord([api.value(6), categoryIndex]);
    const height = api.size([0, 1])[1] * 0.6;

    return {
      type: 'rect',
      shape: {
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height
      },
      style: {
        fill: '#1890ff',
        opacity: 0.8
      }
    };
  }
}
```

### 3.4 状态管理

```typescript
// Zustand Store
import { create } from 'zustand';

interface AppState {
  // HAR 数据
  harData: HARData | null;
  extractedData: ExtractedData | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // UI 状态
  loading: boolean;
  error: string | null;
  activeTab: string;
  
  // 用户设置
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  
  // 历史记录
  history: AnalysisRecord[];
  
  // 操作方法
  setHarData: (data: HARData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addToHistory: (record: AnalysisRecord) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  harData: null,
  extractedData: null,
  performanceMetrics: null,
  loading: false,
  error: null,
  activeTab: 'overview',
  theme: 'light',
  language: 'zh',
  history: JSON.parse(localStorage.getItem('har-analyzer-history') || '[]'),
  
  // 操作方法
  setHarData: (harData) => {
    const parser = new HARParserImpl();
    const analyzer = new PerformanceAnalyzer();
    
    const extractedData = parser.extract(harData);
    const performanceMetrics = analyzer.analyze(harData.log.entries);
    
    set({ 
      harData, 
      extractedData, 
      performanceMetrics,
      error: null
    });
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTheme: (theme) => set({ theme }),
  
  addToHistory: (record) => {
    const history = [...get().history, record].slice(-10); // 保留最近10条
    localStorage.setItem('har-analyzer-history', JSON.stringify(history));
    set({ history });
  },
  
  clearHistory: () => {
    localStorage.removeItem('har-analyzer-history');
    set({ history: [] });
  }
}));
```

## 4. 用户界面设计

### 4.1 页面布局

```typescript
// 主应用组件
const App: React.FC = () => {
  const { theme } = useAppStore();
  
  return (
    <ConfigProvider theme={{ algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm }}>
      <Layout className="app-layout">
        <Header />
        <Layout>
          <Sider width={250} theme={theme}>
            <Navigation />
          </Sider>
          <Content>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </Content>
        </Layout>
        <Footer />
      </Layout>
    </ConfigProvider>
  );
};
```

### 4.2 核心页面组件

#### 4.2.1 上传页面
```typescript
const UploadPage: React.FC = () => {
  const { setHarData, setLoading, setError } = useAppStore();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const parser = new HARParserImpl();
      const harData = await parser.parse(file);
      setHarData(harData);
      
      message.success('HAR 文件解析成功！');
      navigate('/analysis');
    } catch (error) {
      setError(error.message);
      message.error(`解析失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <Card title="上传 HAR 文件" className="upload-card">
        <Dragger
          multiple={false}
          accept=".har"
          beforeUpload={(file) => {
            handleUpload(file);
            return false; // 阻止自动上传
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 HAR 文件到此区域</p>
          <p className="ant-upload-hint">
            支持 .har 格式文件，最大 50MB
          </p>
        </Dragger>
        
        <div className="upload-help">
          <Title level={4}>如何获取 HAR 文件？</Title>
          <Steps direction="vertical" size="small">
            <Step title="打开开发者工具" description="按 F12 或右键选择"检查"" />
            <Step title="切换到 Network 面板" description="选择网络监控选项卡" />
            <Step title="刷新页面" description="执行需要分析的操作" />
            <Step title="导出 HAR" description="右键点击请求列表，选择"Save all as HAR"" />
          </Steps>
        </div>
      </Card>
    </div>
  );
};
```

#### 4.2.2 分析页面
```typescript
const AnalysisPage: React.FC = () => {
  const { harData, performanceMetrics, extractedData } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  if (!harData || !performanceMetrics) {
    return (
      <Result
        status="404"
        title="没有数据"
        subTitle="请先上传 HAR 文件进行分析"
        extra={<Button type="primary" href="/upload">上传文件</Button>}
      />
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: '总览',
      children: <OverviewTab metrics={performanceMetrics} data={extractedData} />
    },
    {
      key: 'performance',
      label: '性能分析',
      children: <PerformanceTab metrics={performanceMetrics} />
    },
    {
      key: 'waterfall',
      label: '瀑布图',
      children: <WaterfallTab entries={harData.log.entries} />
    },
    {
      key: 'requests',
      label: '请求详情',
      children: <RequestsTab entries={harData.log.entries} />
    },
    {
      key: 'report',
      label: '报告',
      children: <ReportTab metrics={performanceMetrics} data={extractedData} />
    }
  ];

  return (
    <div className="analysis-page">
      <PageHeader
        title="分析结果"
        subTitle={`${extractedData?.totalRequests} 个请求`}
        extra={[
          <Button key="export" icon={<DownloadOutlined />}>
            导出报告
          </Button>,
          <Button key="share" icon={<ShareAltOutlined />}>
            分享
          </Button>
        ]}
      />
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="analysis-tabs"
      />
    </div>
  );
};
```

#### 4.2.3 总览面板
```typescript
const OverviewTab: React.FC<{ metrics: PerformanceMetrics; data: ExtractedData }> = ({ metrics, data }) => {
  const chartGenerator = new ChartGenerator();

  return (
    <div className="overview-tab">
      <Row gutter={[16, 16]}>
        {/* 关键指标卡片 */}
        <Col span={6}>
          <Card className="metric-card">
            <Statistic
              title="总请求数"
              value={metrics.requests.total}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <Statistic
              title="平均响应时间"
              value={metrics.responseTime.average}
              precision={0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <Statistic
              title="错误率"
              value={((metrics.requests.clientErrors + metrics.requests.serverErrors) / metrics.requests.total * 100)}
              precision={1}
              suffix="%"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: metrics.requests.clientErrors + metrics.requests.serverErrors > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <Statistic
              title="总传输大小"
              value={metrics.size.totalBytes}
              formatter={(value) => filesize(value as number)}
              prefix={<CloudDownloadOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 响应时间图表 */}
        <Col span={12}>
          <Card title="响应时间分布">
            <ReactECharts
              option={chartGenerator.generateResponseTimeChart(metrics)}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        
        {/* 状态码分布 */}
        <Col span={12}>
          <Card title="状态码分布">
            <ReactECharts
              option={chartGenerator.generateStatusCodeChart(metrics.statusCodeDistribution)}
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 优化建议 */}
      <Card title="优化建议" style={{ marginTop: 16 }}>
        <List
          dataSource={metrics.recommendations}
          renderItem={(item, index) => (
            <List.Item>
              <Typography.Text>
                <Badge count={index + 1} style={{ marginRight: 8 }} />
                {item}
              </Typography.Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
```

## 5. 开发计划

### 5.1 开发里程碑

#### Week 1: 项目搭建和基础组件
- [x] 项目初始化（Vite + React + TypeScript）
- [x] UI 框架集成（Ant Design）
- [x] 路由配置
- [x] 基础布局组件
- [x] 主题系统

#### Week 2: 核心功能开发
- [ ] HAR 文件解析器
- [ ] 性能分析算法
- [ ] 基础图表组件
- [ ] 文件上传组件

#### Week 3: 高级功能和优化
- [ ] 瀑布图实现
- [ ] 数据可视化完善
- [ ] 报告生成功能
- [ ] 本地存储和历史记录

### 5.2 技术要点

#### 5.2.1 性能优化
- 使用 Web Workers 处理大文件解析
- React.memo 优化组件渲染
- 虚拟滚动处理大量数据
- 图表懒加载和按需渲染

#### 5.2.2 用户体验
- 拖拽上传支持
- 实时解析进度显示
- 响应式设计适配移动端
- 键盘快捷键支持

#### 5.2.3 错误处理
- 文件格式验证
- 解析错误友好提示
- 异常边界组件
- 错误上报和日志

### 5.3 部署方案

#### 5.3.1 静态托管
```bash
# 构建
npm run build

# 部署到各种平台
- Vercel (推荐)
- Netlify  
- GitHub Pages
- 腾讯云 COS
- 阿里云 OSS
```

#### 5.3.2 CDN 配置
- 启用 Gzip 压缩
- 设置合适的缓存策略
- 图片和字体资源优化

这个 HAR 分析工具专注于核心功能，技术栈简单可靠，开发周期短，非常适合作为 MVP 产品快速验证市场需求。