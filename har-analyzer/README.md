# HAR Analyzer

🚀 **专业的网络性能分析工具** - 纯前端 HAR 文件分析器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)

产品体验链接：https://har-analyzer-six.vercel.app/

## ✨ 特性

- 🔒 **隐私安全** - 所有数据在本地处理，不上传服务器
- 📊 **深度分析** - 全面的性能指标和错误分析
- 📈 **可视化** - 丰富的图表和数据展示
- 🎯 **智能建议** - 自动生成优化建议
- 💾 **智能存储** - 多层存储架构，支持50+历史记录完整缓存
- 🔄 **快速访问** - 历史记录一键加载，无需重新上传
- ⚙️ **可配置** - 用户可自定义存储设置和缓存策略
- 📱 **响应式** - 支持桌面和移动端
- 🌙 **主题切换** - 明暗主题支持
- 📥 **多格式导出** - PDF、CSV、JSON 格式导出

## 🚀 快速开始

### 环境要求

- Node.js 18.0+ 
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/jlingjace/har-analyzer.git
cd har-analyzer

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用启动脚本
./start.sh
```

访问 `http://localhost:3000` 开始使用。

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

## 📖 使用指南

### 1. 获取 HAR 文件

1. **打开浏览器开发者工具** (F12)
2. **切换到 Network 面板**
3. **执行需要分析的操作** (刷新页面或其他网络操作)
4. **导出 HAR 文件** (右键点击请求列表 → "Save all as HAR")

### 2. 上传和分析

1. 在 HAR Analyzer 中点击或拖拽 HAR 文件到上传区域
2. 系统自动解析和分析文件
3. 查看详细的分析结果和建议

### 3. 历史记录和存储

- **智能缓存** - 自动保存分析结果，支持50+完整记录
- **快速访问** - 历史记录一键加载，自动跳转到分析页面
- **存储管理** - 多层存储架构 (IndexedDB + LocalStorage + Memory)
- **自定义配置** - 可调整缓存大小、记录数量等参数

### 4. 分析报告

- **总览** - 关键指标概览
- **性能分析** - 响应时间、延迟等详细指标
- **请求详情** - 所有网络请求的详细信息
- **错误分析** - 4xx、5xx 错误统计和分析
- **优化建议** - 基于分析结果的智能建议

## 🏗️ 技术架构

### 前端技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design** - UI 组件库
- **Zustand** - 状态管理
- **ECharts** - 数据可视化

### 核心模块

```
src/
├── components/          # UI 组件
│   ├── common/         # 通用组件
│   ├── layout/         # 布局组件
│   ├── pages/          # 页面组件
│   └── analysis/       # 分析相关组件
├── stores/             # 状态管理
├── utils/              # 工具函数
│   ├── harParser.ts    # HAR 文件解析器
│   ├── performanceAnalyzer.ts  # 性能分析器
│   └── storageManager.ts  # 智能存储管理器
├── types/              # TypeScript 类型定义
└── styles/             # 样式文件
```

### 核心算法

#### 智能存储管理器
- 多层存储架构 (IndexedDB + LocalStorage + Memory)
- LRU 缓存淘汰策略
- 数据压缩和序列化优化
- 自动清理和空间管理

#### HAR 解析器
- 验证 HAR 文件格式
- 解析网络请求数据
- 数据清洗和标准化

#### 性能分析器
- 响应时间统计 (平均值、中位数、P95、P99)
- 网络时序分析 (DNS、连接、发送、等待、接收)
- 错误率和状态码分布
- 请求大小和传输量分析

## 📊 分析指标

### 性能指标

- **响应时间** - 最小/最大/平均/中位数/P95/P99
- **网络时序** - DNS 解析、连接建立、数据传输时间
- **传输大小** - 请求和响应大小统计
- **吞吐量** - 数据传输效率分析

### 错误分析

- **4xx 客户端错误** - 请求格式、权限等问题
- **5xx 服务器错误** - 服务器内部错误
- **网络错误** - 连接失败、超时等问题

### 智能建议

基于分析结果自动生成优化建议：
- 响应时间优化
- DNS 解析优化  
- 缓存策略建议
- 资源压缩建议
- HTTP/2 升级建议

## 🔧 配置选项

### 存储配置

```typescript
interface StorageConfig {
  maxCacheSize: number;          // 最大缓存大小 (MB)
  maxHistoryCount: number;       // 最大历史记录数
  compressionEnabled: boolean;   // 启用数据压缩
  preferredStorage: string;      // 优先存储方式
  autoCleanup: boolean;         // 自动清理过期数据
}
```

### 解析选项

```typescript
interface ProcessingOptions {
  includeContent: boolean;    // 是否包含响应内容
  maxEntries: number;         // 最大处理条目数
  filterByDomain: string[];   // 按域名过滤
}
```

### 导出选项

```typescript
interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts: boolean;     // 是否包含图表
  includeRawData: boolean;    // 是否包含原始数据
}
```

## 🚀 部署

### 静态托管

项目构建后生成静态文件，可部署到任何静态托管服务：

- **Vercel** (推荐)
- **Netlify**
- **GitHub Pages**
- **腾讯云 COS**
- **阿里云 OSS**

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🛠️ 开发

### 项目结构

```
har-analyzer/
├── public/                 # 静态资源
├── src/                    # 源代码
├── tests/                  # 测试文件
├── docs/                   # 文档
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目说明
```

### 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
npm run lint       # 代码检查
npm run test       # 运行测试
```

### 代码规范

- 使用 ESLint + Prettier 保证代码质量
- 遵循 TypeScript 严格模式
- 组件使用函数式写法 + Hooks
- 使用 Conventional Commits 提交规范

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行测试覆盖率
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

## 📝 更新日志

### v2.0.0 (最新)
- ✨ **重大更新**: 完全重新设计存储架构
- 💾 支持50+历史记录完整缓存 (vs 之前的单记录限制)
- 🚀 多层存储系统: IndexedDB + LocalStorage + Memory
- 🔄 历史记录一键加载，自动跳转到分析页面
- ⚙️ 新增存储设置页面，用户可自定义缓存参数
- 📊 存储空间使用情况可视化
- 🛠️ LRU 缓存淘汰策略和智能清理
- 🐛 修复 PDF 导出中文乱码问题

### v1.0.0
- 🎉 初始版本发布
- 📊 基础 HAR 文件分析功能
- 📈 性能指标可视化
- 📥 多格式导出支持

## 📝 待办事项

- [x] 添加瀑布图展示
- [x] 智能存储系统和历史记录完整缓存
- [x] 存储设置页面和用户配置
- [x] PDF 导出中文支持优化
- [ ] 数据压缩算法优化 (正在进行)
- [ ] 支持多文件对比分析
- [ ] 添加更多图表类型
- [ ] 支持自定义分析规则
- [ ] 国际化支持
- [ ] PWA 支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 🙏 致谢

- [React](https://reactjs.org/) - UI 框架
- [Ant Design](https://ant.design/) - UI 组件库
- [ECharts](https://echarts.apache.org/) - 数据可视化
- [Vite](https://vitejs.dev/) - 构建工具

## 📞 联系

- 项目主页: [https://github.com/your-username/har-analyzer](https://github.com/your-username/har-analyzer)
- 问题反馈: [https://github.com/your-username/har-analyzer/issues](https://github.com/your-username/har-analyzer/issues)

---

⭐ 如果这个项目对你有帮助，请给一个 Star！
