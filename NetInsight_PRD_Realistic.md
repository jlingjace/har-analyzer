# NetInsight - 网络分析平台技术文档 (务实版)

## 1. 产品概述

### 1.1 产品简介

NetInsight 是一个简洁实用的网络数据分析工具，专注于解析和可视化 HAR 和 PCAP 文件。采用单体应用架构，快速开发部署，为中小企业和个人开发者提供基础的网络分析能力。

### 1.2 核心功能

- **文件解析**：支持 HAR 和 PCAP 文件上传和解析
- **基础分析**：网络性能指标计算和统计
- **数据可视化**：简洁直观的图表展示
- **报告导出**：生成 PDF/CSV 格式报告
- **简单告警**：基于阈值的基础告警功能

### 1.3 技术目标（现实版）

- **文件处理**：支持最大 100MB 文件，适合大部分使用场景
- **并发处理**：支持 10 个并发分析任务
- **响应时间**：文件上传确认 < 5s，分析完成 < 60s
- **系统可用性**：目标 99% 可用性（适合小团队维护）

## 2. 技术架构设计

### 2.1 整体架构（简化版）

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用                                  │
│           React + TypeScript + Ant Design                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP API
┌─────────────────────┴───────────────────────────────────────┐
│                   后端应用                                   │
│              Node.js + Express + TypeScript                 │
├─────────────────────────────────────────────────────────────┤
│  文件上传模块  │  解析引擎  │  分析模块  │  报告生成模块    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                   数据存储                                   │
│         PostgreSQL + Redis + 本地文件存储                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选择（务实方案）

#### 2.2.1 前端技术栈
- **React 18**: 成熟稳定的前端框架
- **TypeScript**: 类型安全，提升开发效率
- **Ant Design**: 完整的 UI 组件库，减少开发时间
- **ECharts**: 功能强大的图表库
- **Axios**: HTTP 客户端库
- **React Router**: 前端路由

#### 2.2.2 后端技术栈
- **Node.js 18**: 统一技术栈，便于团队维护
- **Express.js**: 简单可靠的 Web 框架
- **TypeScript**: 与前端统一语言
- **Multer**: 文件上传处理
- **node-pcap-parser**: PCAP 文件解析
- **Bull**: 简单的作业队列（基于 Redis）

#### 2.2.3 数据存储
- **PostgreSQL**: 主数据库，存储用户数据和分析结果
- **Redis**: 缓存和作业队列
- **本地文件系统**: 文件存储（初期方案）

#### 2.2.4 部署和运维
- **Docker**: 容器化部署
- **PM2**: Node.js 进程管理
- **Nginx**: 反向代理和静态文件服务
- **PostgreSQL**: 数据库
- **Redis**: 缓存服务

## 3. 核心模块设计

### 3.1 文件上传模块

#### 3.1.1 功能范围
- 支持单文件上传（最大 100MB）
- 文件格式验证（HAR/PCAP）
- 基础安全检查
- 上传进度显示

#### 3.1.2 技术实现
```typescript
// 文件上传服务
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${fileId}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.har', '.pcap', '.pcapng'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  }
});

// 文件上传接口
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: '没有文件上传' });
    }

    // 保存文件信息到数据库
    const fileRecord = await saveFileRecord({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      userId: req.user.id
    });

    // 添加到解析队列
    await analysisQueue.add('parse-file', {
      fileId: fileRecord.id,
      filePath: file.path,
      fileType: getFileType(file.originalname)
    });

    res.json({
      success: true,
      data: {
        fileId: fileRecord.id,
        status: 'uploaded'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3.2 文件解析引擎

#### 3.2.1 HAR 文件解析
```typescript
// HAR 文件解析器
class HARParser {
  async parse(filePath: string): Promise<HARData> {
    const content = await fs.readFile(filePath, 'utf-8');
    const harData = JSON.parse(content);
    
    if (!harData.log || !harData.log.entries) {
      throw new Error('无效的 HAR 文件格式');
    }

    return {
      version: harData.log.version,
      creator: harData.log.creator,
      entries: harData.log.entries.map(entry => ({
        startedDateTime: new Date(entry.startedDateTime),
        time: entry.time,
        request: {
          method: entry.request.method,
          url: entry.request.url,
          headers: entry.request.headers,
          bodySize: entry.request.bodySize
        },
        response: {
          status: entry.response.status,
          statusText: entry.response.statusText,
          headers: entry.response.headers,
          bodySize: entry.response.bodySize
        },
        timings: entry.timings
      }))
    };
  }
}
```

#### 3.2.2 PCAP 文件解析
```typescript
// PCAP 文件解析器
import * as pcap from 'pcap-parser';

class PCAPParser {
  async parse(filePath: string): Promise<PCAPData> {
    return new Promise((resolve, reject) => {
      const packets: PacketInfo[] = [];
      
      const parser = pcap.parse(filePath);
      
      parser.on('packet', (packet: any) => {
        try {
          const packetInfo = this.extractPacketInfo(packet);
          if (packetInfo) {
            packets.push(packetInfo);
          }
        } catch (error) {
          console.warn('解析数据包失败:', error.message);
        }
      });
      
      parser.on('end', () => {
        resolve({
          totalPackets: packets.length,
          packets,
          timeRange: this.getTimeRange(packets)
        });
      });
      
      parser.on('error', reject);
    });
  }

  private extractPacketInfo(packet: any): PacketInfo | null {
    // 简化的数据包信息提取
    const timestamp = packet.header.timestampSeconds + 
                     packet.header.timestampMicroseconds / 1000000;
    
    // 基础以太网帧解析
    if (packet.data.length < 14) return null;
    
    const ethernetHeader = packet.data.slice(0, 14);
    const etherType = ethernetHeader.readUInt16BE(12);
    
    // 简单的 IP 包解析
    if (etherType === 0x0800) { // IPv4
      const ipHeader = packet.data.slice(14, 34);
      const srcIP = this.parseIPAddress(ipHeader.slice(12, 16));
      const dstIP = this.parseIPAddress(ipHeader.slice(16, 20));
      const protocol = ipHeader[9];
      
      return {
        timestamp: new Date(timestamp * 1000),
        sourceIP: srcIP,
        destinationIP: dstIP,
        protocol: this.getProtocolName(protocol),
        size: packet.data.length
      };
    }
    
    return null;
  }

  private parseIPAddress(buffer: Buffer): string {
    return Array.from(buffer).join('.');
  }

  private getProtocolName(protocolNumber: number): string {
    const protocols: { [key: number]: string } = {
      1: 'ICMP',
      6: 'TCP',
      17: 'UDP'
    };
    return protocols[protocolNumber] || 'Unknown';
  }
}
```

### 3.3 数据分析模块

#### 3.3.1 基础性能分析
```typescript
// 性能分析器
class PerformanceAnalyzer {
  analyzeHAR(harData: HARData): PerformanceMetrics {
    const entries = harData.entries;
    const responseTimes = entries.map(entry => entry.time);
    
    return {
      totalRequests: entries.length,
      averageResponseTime: this.calculateAverage(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      errorRate: this.calculateErrorRate(entries),
      slowRequests: this.identifySlowRequests(entries, 1000), // > 1s
      statusCodeDistribution: this.getStatusCodeDistribution(entries)
    };
  }

  analyzePCAP(pcapData: PCAPData): NetworkMetrics {
    const packets = pcapData.packets;
    
    return {
      totalPackets: packets.length,
      totalBytes: packets.reduce((sum, p) => sum + p.size, 0),
      protocolDistribution: this.getProtocolDistribution(packets),
      topSourceIPs: this.getTopIPs(packets, 'source'),
      topDestinationIPs: this.getTopIPs(packets, 'destination'),
      trafficOverTime: this.getTrafficOverTime(packets),
      averagePacketSize: packets.reduce((sum, p) => sum + p.size, 0) / packets.length
    };
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private calculateErrorRate(entries: HAREntry[]): number {
    const errorCount = entries.filter(entry => entry.response.status >= 400).length;
    return (errorCount / entries.length) * 100;
  }

  private getProtocolDistribution(packets: PacketInfo[]): { [protocol: string]: number } {
    const distribution: { [protocol: string]: number } = {};
    
    packets.forEach(packet => {
      distribution[packet.protocol] = (distribution[packet.protocol] || 0) + 1;
    });
    
    return distribution;
  }
}
```

### 3.4 可视化模块

#### 3.4.1 图表生成服务
```typescript
// 图表数据生成器
class ChartDataGenerator {
  generateResponseTimeChart(performanceMetrics: PerformanceMetrics): ChartConfig {
    return {
      type: 'line',
      title: '响应时间趋势',
      xAxis: {
        type: 'category',
        data: performanceMetrics.timeLabels
      },
      yAxis: {
        type: 'value',
        name: '响应时间 (ms)'
      },
      series: [{
        name: '响应时间',
        type: 'line',
        data: performanceMetrics.responseTimeSeries,
        smooth: true
      }]
    };
  }

  generateProtocolDistributionChart(networkMetrics: NetworkMetrics): ChartConfig {
    const data = Object.entries(networkMetrics.protocolDistribution)
      .map(([protocol, count]) => ({ name: protocol, value: count }));

    return {
      type: 'pie',
      title: '协议分布',
      series: [{
        name: '协议',
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

  generateStatusCodeChart(performanceMetrics: PerformanceMetrics): ChartConfig {
    const statusData = Object.entries(performanceMetrics.statusCodeDistribution)
      .map(([status, count]) => ({ name: status, value: count }));

    return {
      type: 'bar',
      title: 'HTTP 状态码分布',
      xAxis: {
        type: 'category',
        data: statusData.map(item => item.name)
      },
      yAxis: {
        type: 'value',
        name: '请求数量'
      },
      series: [{
        name: '请求数',
        type: 'bar',
        data: statusData.map(item => item.value),
        itemStyle: {
          color: (params: any) => {
            const status = parseInt(params.name);
            if (status < 300) return '#52c41a'; // 绿色
            if (status < 400) return '#faad14'; // 黄色
            return '#f5222d'; // 红色
          }
        }
      }]
    };
  }
}
```

### 3.5 报告生成模块

#### 3.5.1 PDF 报告生成
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

class ReportGenerator {
  async generatePDFReport(analysisResult: AnalysisResult, outputPath: string): Promise<void> {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));

    // 报告标题
    doc.fontSize(20).text('NetInsight 网络分析报告', 100, 100);
    doc.fontSize(12).text(`生成时间: ${new Date().toLocaleString()}`, 100, 130);

    // 基础信息
    doc.fontSize(16).text('基础信息', 100, 170);
    doc.fontSize(12)
       .text(`文件名: ${analysisResult.fileName}`, 100, 200)
       .text(`文件大小: ${this.formatFileSize(analysisResult.fileSize)}`, 100, 220)
       .text(`分析时间: ${analysisResult.analysisTime}`, 100, 240);

    // 性能指标
    if (analysisResult.performanceMetrics) {
      doc.fontSize(16).text('性能指标', 100, 280);
      const metrics = analysisResult.performanceMetrics;
      doc.fontSize(12)
         .text(`总请求数: ${metrics.totalRequests}`, 100, 310)
         .text(`平均响应时间: ${metrics.averageResponseTime.toFixed(2)}ms`, 100, 330)
         .text(`95% 响应时间: ${metrics.p95ResponseTime.toFixed(2)}ms`, 100, 350)
         .text(`错误率: ${metrics.errorRate.toFixed(2)}%`, 100, 370);
    }

    // 网络指标
    if (analysisResult.networkMetrics) {
      doc.fontSize(16).text('网络指标', 100, 410);
      const metrics = analysisResult.networkMetrics;
      doc.fontSize(12)
         .text(`总数据包: ${metrics.totalPackets}`, 100, 440)
         .text(`总字节数: ${this.formatBytes(metrics.totalBytes)}`, 100, 460)
         .text(`平均包大小: ${metrics.averagePacketSize.toFixed(2)} bytes`, 100, 480);
    }

    // 建议
    doc.fontSize(16).text('优化建议', 100, 520);
    const recommendations = this.generateRecommendations(analysisResult);
    let yPos = 550;
    recommendations.forEach(rec => {
      doc.fontSize(12).text(`• ${rec}`, 100, yPos);
      yPos += 20;
    });

    doc.end();
  }

  private generateRecommendations(analysisResult: AnalysisResult): string[] {
    const recommendations: string[] = [];
    
    if (analysisResult.performanceMetrics) {
      const metrics = analysisResult.performanceMetrics;
      
      if (metrics.averageResponseTime > 1000) {
        recommendations.push('平均响应时间较长，建议优化服务器性能或网络连接');
      }
      
      if (metrics.errorRate > 5) {
        recommendations.push('错误率较高，建议检查服务器错误日志');
      }
      
      if (metrics.slowRequests.length > 0) {
        recommendations.push(`发现 ${metrics.slowRequests.length} 个慢请求，建议优化相关接口`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('网络性能表现良好，无明显问题');
    }
    
    return recommendations;
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  private formatBytes(bytes: number): string {
    return this.formatFileSize(bytes);
  }
}
```

## 4. 数据库设计

### 4.1 简化的数据库结构
```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- 'har' or 'pcap'
    file_size BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分析结果表
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    performance_metrics JSONB,
    network_metrics JSONB,
    chart_data JSONB,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 基础索引
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_analysis_results_file_id ON analysis_results(file_id);
```

## 5. API 设计

### 5.1 RESTful API 接口
```typescript
// API 路由定义
const routes = {
  // 认证
  'POST /api/auth/register': '用户注册',
  'POST /api/auth/login': '用户登录',
  'POST /api/auth/logout': '用户登出',
  
  // 文件管理
  'POST /api/files/upload': '文件上传',
  'GET /api/files': '获取文件列表',
  'GET /api/files/:id': '获取文件详情',
  'DELETE /api/files/:id': '删除文件',
  
  // 分析
  'GET /api/files/:id/analysis': '获取分析结果',
  'POST /api/files/:id/analyze': '重新分析',
  
  // 报告
  'GET /api/files/:id/report/pdf': '下载PDF报告',
  'GET /api/files/:id/report/csv': '下载CSV数据'
};

// API 响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 6. 部署方案

### 6.1 Docker 容器化部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY dist/ ./dist/
COPY public/ ./public/

# 创建上传目录
RUN mkdir -p uploads reports

EXPOSE 3000

CMD ["npm", "start"]
```

### 6.2 Docker Compose 配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/netinsight
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./uploads:/app/uploads
      - ./reports:/app/reports
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=netinsight
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

## 7. 开发计划（现实版）

### 7.1 开发阶段
- **第1-2周**：项目搭建、基础架构、用户认证
- **第3-4周**：文件上传功能、基础解析引擎
- **第5-6周**：HAR 文件解析和基础分析
- **第7-8周**：PCAP 文件解析和网络分析
- **第9-10周**：数据可视化和图表展示
- **第11-12周**：报告生成和导出功能
- **第13-14周**：系统优化和错误处理
- **第15-16周**：测试、部署和文档

### 7.2 技术风险控制
- **文件大小限制**：初期限制在 100MB，避免性能问题
- **功能范围控制**：专注核心功能，避免过度设计
- **技术栈统一**：使用 Node.js + TypeScript，减少学习成本
- **渐进式开发**：先实现 HAR 解析，再扩展到 PCAP

### 7.3 MVP 功能范围
1. 用户注册登录
2. HAR 文件上传和解析
3. 基础性能指标展示
4. 简单的图表可视化
5. PDF 报告导出

这个版本更加务实，适合小团队快速开发和迭代。