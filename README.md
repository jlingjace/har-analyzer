# NetInsight - 网络分析工具

## 🎯 项目概述

**NetInsight** 是一个专为非网络专家设计的网络分析工具，核心价值主张是：**"让你无需成为网络专家，也能看懂网络数据包，快速定位问题"**。

### 目标用户群体
- 🔧 初级运维人员
- 💻 Web/App 开发者
- 🛠️ 技术支持团队
- 🏢 小企业主

### 核心原则
- ✅ 始终保持简单易用
- ✅ 避免功能膨胀
- ✅ 不要变成"网页版 Wireshark"
- ✅ 将技术术语转换为自然语言描述

## 🚀 产品发展规划

### 第一阶段：MVP - 专注"看懂" ✅
- [x] HAR 文件上传和解析
- [x] 基础网络请求展示
- [x] 简单性能指标
- [x] 基本错误统计

### 第二阶段：增强 - 专注"分析" ✅
- [x] HTTP 会话流重建（杀手级功能）
- [x] 智能诊断引擎
- [x] 性能问题自动检测
- [x] 安全风险识别
- [x] 优化建议生成

### 第三阶段：生态 - 专注"扩展" 🔄
- [ ] 多种数据源支持
- [ ] 团队协作功能
- [ ] API 接口开放
- [ ] 插件系统

## 🎯 核心功能

### 1. HTTP 会话流重建 🔥
**杀手级功能** - 自动重建 TCP 流为可读的 HTTP 请求/响应对

**功能特点：**
- 📊 类似浏览器开发者工具 Network 面板
- 🔍 提供性能洞察和安全审计
- 📈 自动分析请求响应关系
- 🎯 智能识别问题请求

**使用场景：**
- 分析 Web 应用性能问题
- 调试 API 接口调用
- 检查 HTTP 缓存策略
- 识别安全风险

### 2. 智能诊断引擎 🧠
**将技术术语转换为自然语言描述**

**诊断能力：**
- 🚨 性能问题自动检测
- 🔒 安全风险识别
- 📊 错误模式分析
- 💡 优化建议生成
- 🩺 智能健康评估

**输出示例：**
- ❌ 技术术语：`DNS resolution time: 2.5s`
- ✅ 自然语言：`网站域名解析速度较慢，建议优化 DNS 设置`

### 3. 性能分析面板 📊
**全面的性能指标展示**

**关键指标：**
- ⏱️ 响应时间分析（平均值、中位数、P95、P99）
- 🌐 网络时序分析（DNS、连接、发送、等待、接收）
- 📈 传输量统计
- 🎯 错误率监控

### 4. 错误分析 🔍
**智能识别和分析各类错误**

**错误类型：**
- 4xx 客户端错误分析
- 5xx 服务器错误分析
- 网络连接错误
- 性能超时问题

## 🛠️ 技术架构

### 前端技术栈
- **React 18** + **TypeScript** - 现代化前端框架
- **Vite** - 快速构建工具
- **Ant Design** - 企业级 UI 组件库
- **Zustand** - 轻量级状态管理
- **ECharts** - 专业数据可视化

### 核心模块
```
src/
├── components/          # UI 组件
│   ├── analysis/       # 分析相关组件
│   ├── charts/         # 图表组件
│   ├── layout/         # 布局组件
│   └── pages/          # 页面组件
├── stores/             # 状态管理
├── utils/              # 核心工具
│   ├── harParser.ts    # HAR 解析器
│   └── performanceAnalyzer.ts  # 性能分析器
└── types/              # 类型定义
```

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

### 安装和运行

```bash
# 进入项目目录
cd har-analyzer

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用启动脚本
./start.sh
```

访问 `http://localhost:3000` 开始使用。

## 📖 使用指南

### 1. 获取 HAR 文件
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 面板
3. 执行需要分析的操作
4. 导出 HAR 文件 (右键 → "Save all as HAR")

### 2. 上传和分析
1. 在 NetInsight 中上传 HAR 文件
2. 系统自动解析和分析
3. 查看智能诊断结果

### 3. 分析报告
- **总览** - 关键指标概览
- **性能分析** - 详细性能指标
- **请求详情** - HTTP 会话流重建
- **错误分析** - 智能错误诊断
- **优化建议** - 自动生成的改进建议

## 📊 核心算法

### HAR 解析算法
```typescript
interface HarParser {
  // 验证 HAR 文件格式
  validateFormat(file: File): boolean;
  
  // 解析网络请求数据
  parseRequests(harData: HarFile): Request[];
  
  // 数据清洗和标准化
  normalizeData(requests: Request[]): NormalizedRequest[];
}
```

### 性能分析算法
```typescript
interface PerformanceAnalyzer {
  // 响应时间统计
  calculateResponseTimes(requests: Request[]): ResponseTimeStats;
  
  // 网络时序分析
  analyzeNetworkTimings(requests: Request[]): NetworkTimingAnalysis;
  
  // 错误率分析
  analyzeErrorRate(requests: Request[]): ErrorAnalysis;
  
  // 生成优化建议
  generateRecommendations(analysis: Analysis): Recommendation[];
}
```

### 智能诊断算法
```typescript
interface DiagnosticEngine {
  // 性能问题检测
  detectPerformanceIssues(requests: Request[]): PerformanceIssue[];
  
  // 安全风险识别
  identifySecurityRisks(requests: Request[]): SecurityRisk[];
  
  // 将技术术语转换为自然语言
  translateToNaturalLanguage(issues: Issue[]): string[];
}
```

## 🔒 隐私安全

- ✅ 所有数据在本地处理
- ✅ 不上传任何文件到服务器
- ✅ 纯前端应用，保障数据隐私

## 📊 系统状态

### 已完成功能 ✅
- [x] HAR 文件解析
- [x] HTTP 会话流重建
- [x] 智能诊断引擎
- [x] 性能分析面板
- [x] 错误分析模块
- [x] 优化建议生成
- [x] 数据可视化
- [x] 响应式设计

### 技术问题状态 ✅
- [x] 上传时间显示修复
- [x] 数据库 Schema 更新
- [x] HTTP 会话流重建正确显示
- [x] 智能诊断引擎正确显示
- [x] 系统功能完整，稳定性良好

## 🚀 部署方案

### 静态托管（推荐）
- **Vercel** - 自动 CI/CD
- **Netlify** - 简单部署
- **GitHub Pages** - 免费托管

### 自托管
```bash
# 构建生产版本
npm run build

# 使用 nginx 或其他静态服务器托管 dist 目录
```

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

## 📄 许可证

MIT License

## 📞 联系我们

- 项目地址: https://github.com/jlingjace/har-analyzer
- 问题反馈: Issues 页面

---

**记住：我们的目标是让网络分析变得简单！** 🎯 