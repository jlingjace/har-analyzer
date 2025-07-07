# NetInsight - 网络分析平台技术需求文档 (TRD)

## 1. 产品概述

### 1.1 产品简介

NetInsight 是一个基于云原生架构的网络分析平台，支持多种网络数据格式（HAR、pcap、pcapng）的解析和分析。平台通过微服务架构提供高性能的数据处理能力，为网络管理员和安全分析师提供深度的网络洞察。

### 1.2 核心功能

- **数据解析引擎**：支持 HAR 1.1/1.2、pcap/pcapng 格式解析
- **实时分析**：流式数据处理，支持大文件分析
- **多维度可视化**：网络拓扑、时序分析、协议分布图表
- **智能告警**：基于规则引擎和机器学习的异常检测
- **API 集成**：RESTful API 支持自动化集成

### 1.3 技术目标

- **高性能**：单文件处理能力 ≥ 5GB，并发处理 ≥ 100 任务
- **低延迟**：文件上传响应时间 < 2s，基础分析完成时间 < 30s
- **高可用性**：系统可用性 ≥ 99.9%，支持自动故障转移
- **可扩展性**：支持水平扩展，模块化部署

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   API 网关      │    │   微服务集群    │
│   (React/TS)   │◄──►│   (Kong/Nginx)  │◄──►│   (容器化)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                       ┌─────────────────┐            │
                       │   消息队列      │◄───────────┘
                       │   (RabbitMQ)   │
                       └─────────────────┘
                                │
    ┌─────────────────┐         │         ┌─────────────────┐
    │   数据存储      │◄────────┼────────►│   文件存储      │
    │   (PostgreSQL)  │         │         │   (MinIO/S3)   │
    └─────────────────┘         │         └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   缓存层        │
                       │   (Redis)      │
                       └─────────────────┘
```

### 2.2 核心模块

#### 2.2.1 文件解析服务
- **支持格式**：HAR 1.1/1.2、pcap/pcapng、压缩包自动解压
- **解析引擎**：基于 Scapy 和 tshark 的高性能解析器
- **流式处理**：支持大文件分块处理，内存使用 < 1GB
- **数据提取**：自动提取 IP、端口、协议、时间戳等关键信息

#### 2.2.2 数据分析引擎
- **性能分析**：延迟、丢包率、吞吐量、连接状态统计
- **协议分析**：HTTP/HTTPS、TCP/UDP、DNS 等协议深度解析
- **安全检测**：基于 Suricata 规则引擎的威胁检测
- **异常识别**：机器学习算法识别异常流量模式

#### 2.2.3 可视化引擎
- **实时仪表板**：基于 WebSocket 的实时数据推送
- **交互式图表**：ECharts + D3.js 实现的高性能图表
- **网络拓扑**：基于 Force-directed 算法的动态拓扑图
- **时序分析**：时间序列数据的多维度展示

#### 2.2.4 告警系统
- **规则引擎**：支持自定义告警规则和阈值配置
- **多渠道通知**：邮件、Webhook、短信等通知方式
- **告警聚合**：防止告警风暴，智能去重和聚合
- **升级机制**：支持告警升级和自动处理流程

## 3. 技术栈详细说明

### 3.1 前端技术栈

#### 3.1.1 核心框架
- **React 18.2+** + **TypeScript 5.0+**
- **Next.js 13+** (App Router) - SSR/SSG 支持
- **React Query (TanStack Query)** - 数据状态管理
- **Zustand** - 轻量级状态管理

#### 3.1.2 UI 组件库
- **Ant Design 5.0+** - 主要 UI 组件
- **Tailwind CSS 3.0+** - 样式工具
- **Framer Motion** - 动画库

#### 3.1.3 数据可视化
- **ECharts 5.0+** - 主要图表库
- **D3.js 7.0+** - 自定义可视化
- **React Flow** - 网络拓扑图
- **Recharts** - 轻量级图表

#### 3.1.4 开发工具
- **Vite** - 构建工具
- **ESLint + Prettier** - 代码规范
- **Vitest** - 单元测试
- **Playwright** - E2E 测试

### 3.2 后端技术栈

#### 3.2.1 API 服务
- **Node.js 18+ LTS** + **Express.js 4.18+**
- **TypeScript 5.0+** - 类型安全
- **Fastify** - 高性能 HTTP 框架（可选）
- **GraphQL** + **Apollo Server** - API 查询层

#### 3.2.2 数据处理服务
- **Python 3.11+** - 数据分析主力
- **FastAPI** - Python API 框架
- **Celery** - 异步任务队列
- **NumPy** + **Pandas** - 数据处理
- **Scapy** - 网络包解析
- **Suricata** - 安全规则引擎

#### 3.2.3 存储系统
- **PostgreSQL 15+** - 主数据库
- **Redis 7.0+** - 缓存和会话存储
- **InfluxDB 2.0+** - 时序数据存储
- **MinIO** - 对象存储（S3 兼容）

#### 3.2.4 消息队列
- **RabbitMQ 3.11+** - 消息代理
- **Apache Kafka** - 大规模流处理（可选）

### 3.3 基础设施

#### 3.3.1 容器化
- **Docker 24.0+** - 容器运行时
- **Kubernetes 1.28+** - 容器编排
- **Helm 3.0+** - 包管理器

#### 3.3.2 网关和代理
- **Kong 3.0+** - API 网关
- **Nginx** - 反向代理和负载均衡
- **Traefik** - 云原生边缘路由器

#### 3.3.3 监控和日志
- **Prometheus** - 指标收集
- **Grafana** - 监控仪表板
- **ELK Stack** - 日志管理
- **Jaeger** - 分布式链路追踪

### 3.4 数据处理流程

#### 3.4.1 文件处理流水线
```python
# 文件处理流程示例
class FileProcessor:
    def __init__(self):
        self.parser = PacketParser()
        self.analyzer = NetworkAnalyzer()
        self.storage = DataStorage()
    
    async def process_file(self, file_path: str, user_id: str):
        # 1. 文件验证
        if not self.validate_file(file_path):
            raise ValueError("Invalid file format")
        
        # 2. 解析文件
        packets = await self.parser.parse_async(file_path)
        
        # 3. 分析数据
        analysis_result = await self.analyzer.analyze(packets)
        
        # 4. 存储结果
        report_id = await self.storage.save_analysis(
            user_id, analysis_result
        )
        
        return report_id
```

#### 3.4.2 实时数据处理
```python
# 实时数据处理示例
class StreamProcessor:
    def __init__(self):
        self.consumer = KafkaConsumer()
        self.analyzer = RealTimeAnalyzer()
        self.alerter = AlertManager()
    
    async def process_stream(self):
        async for message in self.consumer:
            packet_data = json.loads(message.value)
            
            # 实时分析
            analysis = await self.analyzer.analyze_packet(packet_data)
            
            # 检查告警条件
            if analysis.is_anomaly:
                await self.alerter.trigger_alert(analysis)
```

### 3.5 API 设计规范

#### 3.5.1 REST API 设计
```typescript
// API 接口定义
interface FileUploadAPI {
  // 上传文件
  POST /api/v1/files
  Content-Type: multipart/form-data
  
  // 查询分析状态
  GET /api/v1/files/{fileId}/status
  
  // 获取分析结果
  GET /api/v1/files/{fileId}/analysis
  
  // 删除文件
  DELETE /api/v1/files/{fileId}
}

// 分析结果数据结构
interface AnalysisResult {
  id: string;
  fileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary: {
    totalPackets: number;
    totalConnections: number;
    protocols: Record<string, number>;
    timeRange: {
      start: string;
      end: string;
    };
  };
  performance: {
    avgLatency: number;
    packetLoss: number;
    throughput: number;
  };
  security: {
    threats: SecurityThreat[];
    anomalies: Anomaly[];
  };
}
```

#### 3.5.2 GraphQL Schema
```graphql
type Query {
  getAnalysis(id: ID!): Analysis
  getFiles(userId: ID!): [File!]!
  getAlerts(userId: ID!): [Alert!]!
}

type Mutation {
  uploadFile(input: FileUploadInput!): FileUploadResult!
  createAlert(input: AlertInput!): Alert!
  updateAnalysis(id: ID!, input: AnalysisUpdateInput!): Analysis!
}

type Subscription {
  analysisProgress(fileId: ID!): AnalysisProgress!
  newAlerts(userId: ID!): Alert!
}
```

### 3.6 性能优化策略

#### 3.6.1 数据库优化
- **索引策略**：为查询字段创建复合索引
- **分区表**：按时间分区存储大量数据
- **读写分离**：主从数据库架构
- **连接池**：优化数据库连接管理

#### 3.6.2 缓存策略
- **Redis 集群**：高可用缓存集群
- **多级缓存**：浏览器 → CDN → 应用缓存 → 数据库
- **缓存预热**：预加载热点数据
- **缓存更新**：使用 pub/sub 模式更新缓存

#### 3.6.3 异步处理
- **任务队列**：使用 Celery 处理耗时任务
- **批处理**：合并小任务减少开销
- **优先级队列**：重要任务优先处理
- **失败重试**：指数退避重试机制

## 4. 开发和部署规范

### 4.1 开发环境配置

#### 4.1.1 本地开发环境
```bash
# 前端开发环境
npm install -g pnpm
pnpm install
pnpm dev

# 后端开发环境
pip install -r requirements.txt
python -m uvicorn main:app --reload

# 数据库启动
docker-compose up -d postgres redis
```

#### 4.1.2 代码规范
- **前端**：ESLint + Prettier + Husky
- **后端**：Black + isort + mypy
- **提交规范**：Conventional Commits
- **分支策略**：GitFlow

### 4.2 测试策略

#### 4.2.1 测试分层
- **单元测试**：覆盖率 > 80%
- **集成测试**：API 接口测试
- **E2E 测试**：关键用户路径
- **性能测试**：负载和压力测试

#### 4.2.2 测试工具
- **前端**：Vitest + Testing Library
- **后端**：pytest + pytest-asyncio
- **API 测试**：Postman + Newman
- **性能测试**：K6 + Artillery

### 4.3 CI/CD 流水线

#### 4.3.1 构建流程
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
      - name: Build application
        run: pnpm build
```

#### 4.3.2 部署策略
- **开发环境**：自动部署到测试集群
- **预发布环境**：手动触发部署
- **生产环境**：蓝绿部署 + 回滚机制

### 4.4 监控和告警

#### 4.4.1 应用监控
- **APM**：New Relic / DataDog
- **错误监控**：Sentry
- **性能监控**：Prometheus + Grafana
- **日志管理**：ELK Stack

#### 4.4.2 告警配置
- **系统告警**：CPU > 80%，内存 > 85%
- **应用告警**：错误率 > 5%，响应时间 > 2s
- **业务告警**：分析失败率 > 10%

## 5. 数据模型设计

### 5.1 数据库设计

#### 5.1.1 用户相关表
```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE files (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分析结果表
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY,
    file_id UUID REFERENCES files(id),
    result_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.2 时序数据模型
```sql
-- InfluxDB 时序数据结构
measurement: network_metrics
tags:
  - file_id
  - protocol
  - source_ip
  - dest_ip
fields:
  - latency (float)
  - packet_size (integer)
  - throughput (float)
  - error_rate (float)
timestamp: RFC3339
```

### 5.2 Redis 缓存设计

#### 5.2.1 缓存键命名规范
```redis
# 用户会话
session:{user_id}

# 文件分析状态
analysis:status:{file_id}

# 分析结果缓存
analysis:result:{file_id}

# 告警规则缓存
alerts:rules:{user_id}
```

## 6. 安全设计

### 6.1 认证和授权

#### 6.1.1 JWT 认证
```typescript
interface JWTPayload {
  sub: string;        // 用户ID
  email: string;      // 用户邮箱
  role: string;       // 用户角色
  exp: number;        // 过期时间
  iat: number;        // 签发时间
}
```

#### 6.1.2 API 权限控制
```typescript
// 权限装饰器
@RequirePermission('file:upload')
async uploadFile(req: Request, res: Response) {
  // 处理文件上传
}

@RequireRole('admin')
async deleteUser(req: Request, res: Response) {
  // 删除用户
}
```

### 6.2 数据安全

#### 6.2.1 敏感数据处理
- **数据加密**：AES-256 加密存储
- **传输加密**：TLS 1.3
- **数据脱敏**：自动检测和脱敏 PII 数据
- **访问控制**：基于角色的细粒度权限

#### 6.2.2 安全策略
- **输入验证**：严格的输入验证和过滤
- **SQL 注入防护**：使用参数化查询
- **XSS 防护**：Content Security Policy
- **CSRF 防护**：CSRF Token 验证

## 7. 项目管理

### 7.1 开发里程碑

#### 7.1.1 Phase 1 (4 周) - 基础架构
- [ ] 项目搭建和CI/CD流水线
- [ ] 用户认证系统
- [ ] 文件上传模块
- [ ] 基础数据库设计

#### 7.1.2 Phase 2 (6 周) - 核心功能
- [ ] 文件解析引擎
- [ ] 数据分析模块
- [ ] 基础可视化组件
- [ ] API 接口开发

#### 7.1.3 Phase 3 (4 周) - 高级功能
- [ ] 安全分析模块
- [ ] 告警系统
- [ ] 报告生成
- [ ] 性能优化

#### 7.1.4 Phase 4 (2 周) - 测试和部署
- [ ] 完整测试覆盖
- [ ] 性能测试
- [ ] 生产环境部署
- [ ] 文档完善

### 7.2 质量保证

#### 7.2.1 代码质量
- **代码审查**：所有代码必须经过同行审查
- **自动化测试**：CI/CD 流水线中的自动化测试
- **静态分析**：SonarQube 代码质量检查
- **安全扫描**：Snyk 依赖安全扫描

#### 7.2.2 性能基准
- **响应时间**：API 响应时间 < 200ms (P95)
- **吞吐量**：支持 1000 并发请求
- **可用性**：99.9% 系统可用性
- **错误率**：< 0.1% 错误率

---

这个技术需求文档专注于为程序员提供清晰的技术实现指导，包括详细的技术栈选择、代码示例、数据模型设计和开发规范。