# NetInsight - 简化架构设计文档

## 1. 系统架构概述

### 1.1 整体架构（务实版）

NetInsight 采用简化的单体应用架构，适合小团队快速开发和维护。避免过度设计的微服务复杂度，专注于核心功能实现。

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层                                │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │  Web 前端   │  │  移动端     │  │  API 文档   │             │
│   │(React/TS)   │  │(响应式设计) │  │(Swagger)    │             │
│   └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                        应用服务层                                │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │  API 网关   │  │  认证中间件 │  │  文件中间件 │             │
│   │  (Express)  │  │   (JWT)     │  │  (Multer)   │             │
│   └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        业务逻辑层                                │
│ ┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐    │
│ │  用户服务   ││  文件服务   ││  解析服务   ││  分析服务   │    │
│ │(User Svc)   ││(File Svc)   ││(Parser Svc) ││(Analysis)   │    │
│ └─────────────┘└─────────────┘└─────────────┘└─────────────┘    │
│ ┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐    │
│ │  可视化服务 ││  报告服务   ││  任务队列   ││  通知服务   │    │
│ │(Chart Svc)  ││(Report Svc) ││(Queue Svc)  ││(Notify Svc) │    │
│ └─────────────┘└─────────────┘└─────────────┘└─────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层                                │
│ ┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐    │
│ │ PostgreSQL  ││   Redis     ││  文件系统   ││   日志      │    │
│ │ (主数据库)  ││  (缓存)     ││ (本地存储)  ││ (Winston)   │    │
│ └─────────────┘└─────────────┘└─────────────┘└─────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈简化

#### 1.2.1 核心技术选择
- **统一语言**: TypeScript (前后端统一)
- **前端框架**: React 18 + Ant Design
- **后端框架**: Node.js + Express
- **数据库**: PostgreSQL (主) + Redis (缓存)
- **部署**: Docker + Docker Compose

#### 1.2.2 避免的复杂技术
- ❌ 微服务架构 (Kubernetes, 服务网格)
- ❌ 多种编程语言 (Python, Go 混合)
- ❌ 复杂消息队列 (Kafka, RabbitMQ)
- ❌ 时序数据库 (InfluxDB)
- ❌ 复杂的 ML 框架
- ❌ 对象存储 (MinIO/S3)

## 2. 核心服务设计

### 2.1 用户管理服务

#### 2.1.1 功能范围
```typescript
// 用户服务接口 (简化版)
interface UserService {
  // 基础认证
  register(userData: RegisterDto): Promise<User>;
  login(credentials: LoginDto): Promise<AuthResult>;
  logout(token: string): Promise<void>;
  
  // 用户管理
  getProfile(userId: string): Promise<User>;
  updateProfile(userId: string, updates: UpdateUserDto): Promise<User>;
  
  // 简单权限
  hasPermission(userId: string, resource: string): Promise<boolean>;
}

// 简化的用户模型
interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';  // 只有两种角色
  createdAt: Date;
  lastLoginAt?: Date;
}

// 认证结果
interface AuthResult {
  user: User;
  token: string;
  expiresIn: number;
}
```

#### 2.1.2 实现示例
```typescript
// 用户服务实现
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async register(userData: RegisterDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepo.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 创建用户
    const user = await this.userRepo.create({
      email: userData.email,
      name: userData.name,
      passwordHash: hashedPassword,
      role: 'user'
    });

    return this.sanitizeUser(user);
  }

  async login(credentials: LoginDto): Promise<AuthResult> {
    // 查找用户
    const user = await this.userRepo.findByEmail(credentials.email);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(
      credentials.password, 
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new Error('密码错误');
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // 更新最后登录时间
    await this.userRepo.updateLastLogin(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
      expiresIn: 86400 // 24小时
    };
  }

  private sanitizeUser(user: any): User {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
```

### 2.2 文件管理服务

#### 2.2.1 简化的文件处理
```typescript
// 文件服务接口
interface FileService {
  // 基础文件操作
  uploadFile(file: Express.Multer.File, userId: string): Promise<FileRecord>;
  getFileList(userId: string, options?: ListOptions): Promise<FileRecord[]>;
  getFileById(fileId: string, userId: string): Promise<FileRecord>;
  deleteFile(fileId: string, userId: string): Promise<void>;
  
  // 文件处理状态
  getProcessingStatus(fileId: string): Promise<ProcessingStatus>;
}

// 简化的文件记录
interface FileRecord {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: 'har' | 'pcap';
  fileSize: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  uploadedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}
```

#### 2.2.2 文件上传实现
```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

export class FileService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor(
    private fileRepo: FileRepository,
    private queueService: QueueService
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string): Promise<FileRecord> {
    // 验证文件类型
    const fileType = this.detectFileType(file.originalname);
    if (!fileType) {
      throw new Error('不支持的文件格式');
    }

    // 生成唯一文件名
    const fileId = uuidv4();
    const fileName = `${fileId}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadDir, fileName);

    // 移动文件到目标位置
    await fs.rename(file.path, filePath);

    // 保存文件记录
    const fileRecord = await this.fileRepo.create({
      id: fileId,
      userId,
      originalName: file.originalname,
      fileName,
      filePath,
      fileType,
      fileSize: file.size,
      status: 'uploaded'
    });

    // 添加到处理队列
    await this.queueService.addFileProcessingJob({
      fileId,
      filePath,
      fileType
    });

    return fileRecord;
  }

  private detectFileType(filename: string): 'har' | 'pcap' | null {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.har') return 'har';
    if (ext === '.pcap' || ext === '.pcapng') return 'pcap';
    return null;
  }

  async getFileList(userId: string, options: ListOptions = {}): Promise<FileRecord[]> {
    const { page = 1, limit = 20, status } = options;
    
    return this.fileRepo.findByUserId(userId, {
      offset: (page - 1) * limit,
      limit,
      status,
      orderBy: 'uploadedAt DESC'
    });
  }
}
```

### 2.3 数据解析服务

#### 2.3.1 统一解析接口
```typescript
// 解析服务接口
interface ParserService {
  parseFile(fileId: string): Promise<ParseResult>;
  getParseResult(fileId: string): Promise<ParseResult | null>;
}

// 统一的解析结果
interface ParseResult {
  fileId: string;
  fileType: 'har' | 'pcap';
  parsedAt: Date;
  summary: {
    totalRecords: number;
    timeRange: {
      start: Date;
      end: Date;
    };
    dataSize: number;
  };
  data: HARData | PCAPData;
}

// HAR 数据结构
interface HARData {
  version: string;
  creator: {
    name: string;
    version: string;
  };
  entries: HAREntry[];
}

interface HAREntry {
  startedDateTime: Date;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    bodySize: number;
  };
  timings: {
    dns?: number;
    connect?: number;
    send: number;
    wait: number;
    receive: number;
  };
}

// PCAP 数据结构 (简化)
interface PCAPData {
  totalPackets: number;
  packets: PacketInfo[];
  statistics: {
    protocolDistribution: Record<string, number>;
    ipDistribution: Record<string, number>;
    portDistribution: Record<number, number>;
  };
}

interface PacketInfo {
  timestamp: Date;
  sourceIP: string;
  destinationIP: string;
  sourcePort?: number;
  destinationPort?: number;
  protocol: string;
  size: number;
  flags?: string[];
}
```

#### 2.3.2 HAR 解析器实现
```typescript
import fs from 'fs/promises';

export class HARParser {
  async parse(filePath: string): Promise<HARData> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const harContent = JSON.parse(content);

      // 验证 HAR 格式
      if (!harContent.log || !Array.isArray(harContent.log.entries)) {
        throw new Error('无效的 HAR 文件格式');
      }

      // 处理条目
      const entries: HAREntry[] = harContent.log.entries.map((entry: any) => ({
        startedDateTime: new Date(entry.startedDateTime),
        time: entry.time || 0,
        request: {
          method: entry.request.method || 'GET',
          url: entry.request.url || '',
          httpVersion: entry.request.httpVersion || 'HTTP/1.1',
          headers: entry.request.headers || [],
          bodySize: entry.request.bodySize || 0
        },
        response: {
          status: entry.response.status || 0,
          statusText: entry.response.statusText || '',
          httpVersion: entry.response.httpVersion || 'HTTP/1.1',
          headers: entry.response.headers || [],
          bodySize: entry.response.bodySize || 0
        },
        timings: {
          dns: entry.timings.dns >= 0 ? entry.timings.dns : undefined,
          connect: entry.timings.connect >= 0 ? entry.timings.connect : undefined,
          send: entry.timings.send || 0,
          wait: entry.timings.wait || 0,
          receive: entry.timings.receive || 0
        }
      }));

      return {
        version: harContent.log.version || '1.2',
        creator: harContent.log.creator || { name: 'Unknown', version: '0.0.0' },
        entries
      };
    } catch (error) {
      throw new Error(`HAR 文件解析失败: ${error.message}`);
    }
  }
}
```

#### 2.3.3 PCAP 解析器实现 (简化版)
```typescript
import { spawn } from 'child_process';
import csv from 'csv-parser';
import fs from 'fs';

export class PCAPParser {
  async parse(filePath: string): Promise<PCAPData> {
    // 使用 tshark 命令行工具解析 PCAP
    const csvPath = `${filePath}.csv`;
    
    try {
      // 调用 tshark 生成 CSV
      await this.runTshark(filePath, csvPath);
      
      // 解析 CSV 文件
      const packets = await this.parseCsv(csvPath);
      
      // 生成统计信息
      const statistics = this.generateStatistics(packets);
      
      // 清理临时文件
      await fs.promises.unlink(csvPath);
      
      return {
        totalPackets: packets.length,
        packets,
        statistics
      };
    } catch (error) {
      throw new Error(`PCAP 文件解析失败: ${error.message}`);
    }
  }

  private runTshark(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-r', inputPath,
        '-T', 'fields',
        '-e', 'frame.time_epoch',
        '-e', 'ip.src',
        '-e', 'ip.dst',
        '-e', 'tcp.srcport',
        '-e', 'tcp.dstport',
        '-e', 'udp.srcport',
        '-e', 'udp.dstport',
        '-e', 'ip.proto',
        '-e', 'frame.len',
        '-e', 'tcp.flags',
        '-E', 'header=y',
        '-E', 'separator=,',
        '-E', 'quote=d'
      ];

      const tshark = spawn('tshark', args);
      const writeStream = fs.createWriteStream(outputPath);
      
      tshark.stdout.pipe(writeStream);
      
      tshark.on('error', reject);
      tshark.on('close', (code) => {
        writeStream.end();
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tshark 进程退出码: ${code}`));
        }
      });
    });
  }

  private parseCsv(csvPath: string): Promise<PacketInfo[]> {
    return new Promise((resolve, reject) => {
      const packets: PacketInfo[] = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: any) => {
          try {
            const packet: PacketInfo = {
              timestamp: new Date(parseFloat(row['frame.time_epoch']) * 1000),
              sourceIP: row['ip.src'] || '',
              destinationIP: row['ip.dst'] || '',
              sourcePort: parseInt(row['tcp.srcport'] || row['udp.srcport']) || undefined,
              destinationPort: parseInt(row['tcp.dstport'] || row['udp.dstport']) || undefined,
              protocol: this.getProtocolName(parseInt(row['ip.proto'])),
              size: parseInt(row['frame.len']) || 0,
              flags: row['tcp.flags'] ? row['tcp.flags'].split(',') : undefined
            };
            
            if (packet.sourceIP && packet.destinationIP) {
              packets.push(packet);
            }
          } catch (error) {
            console.warn('解析数据包行失败:', error.message);
          }
        })
        .on('end', () => resolve(packets))
        .on('error', reject);
    });
  }

  private getProtocolName(protocolNumber: number): string {
    const protocols: Record<number, string> = {
      1: 'ICMP',
      6: 'TCP',
      17: 'UDP'
    };
    return protocols[protocolNumber] || `Protocol-${protocolNumber}`;
  }

  private generateStatistics(packets: PacketInfo[]): PCAPData['statistics'] {
    const protocolDistribution: Record<string, number> = {};
    const ipDistribution: Record<string, number> = {};
    const portDistribution: Record<number, number> = {};

    packets.forEach(packet => {
      // 协议分布
      protocolDistribution[packet.protocol] = 
        (protocolDistribution[packet.protocol] || 0) + 1;

      // IP 分布
      ipDistribution[packet.sourceIP] = 
        (ipDistribution[packet.sourceIP] || 0) + 1;
      ipDistribution[packet.destinationIP] = 
        (ipDistribution[packet.destinationIP] || 0) + 1;

      // 端口分布
      if (packet.destinationPort) {
        portDistribution[packet.destinationPort] = 
          (portDistribution[packet.destinationPort] || 0) + 1;
      }
    });

    return {
      protocolDistribution,
      ipDistribution,
      portDistribution
    };
  }
}
```

### 2.4 数据分析服务

#### 2.4.1 统一分析接口
```typescript
// 分析服务接口
interface AnalysisService {
  analyzeFile(fileId: string): Promise<AnalysisResult>;
  getAnalysisResult(fileId: string): Promise<AnalysisResult | null>;
}

// 分析结果结构
interface AnalysisResult {
  fileId: string;
  analyzedAt: Date;
  summary: AnalysisSummary;
  performance?: PerformanceMetrics;
  network?: NetworkMetrics;
  security?: SecurityInsights;
  charts: ChartData[];
}

interface AnalysisSummary {
  fileType: 'har' | 'pcap';
  totalRecords: number;
  timeSpan: number; // 秒
  dataVolume: number; // 字节
  keyFindings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}
```

#### 2.4.2 HAR 分析器
```typescript
export class HARAnalyzer {
  analyze(harData: HARData): PerformanceMetrics {
    const entries = harData.entries;
    const responseTimes = entries.map(e => e.time).filter(t => t > 0);
    const statusCodes = entries.map(e => e.response.status);

    // 基础性能指标
    const performance: PerformanceMetrics = {
      totalRequests: entries.length,
      averageResponseTime: this.average(responseTimes),
      medianResponseTime: this.median(responseTimes),
      p95ResponseTime: this.percentile(responseTimes, 95),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      
      // 错误分析
      errorRate: this.calculateErrorRate(statusCodes),
      statusCodeDistribution: this.groupBy(statusCodes),
      
      // 慢请求识别
      slowRequests: entries.filter(e => e.time > 2000).length,
      verySlowRequests: entries.filter(e => e.time > 5000).length,
      
      // 时间分析
      dnsTime: this.average(entries.map(e => e.timings.dns || 0).filter(t => t > 0)),
      connectTime: this.average(entries.map(e => e.timings.connect || 0).filter(t => t > 0)),
      sendTime: this.average(entries.map(e => e.timings.send)),
      waitTime: this.average(entries.map(e => e.timings.wait)),
      receiveTime: this.average(entries.map(e => e.timings.receive)),
      
      // 请求大小分析
      requestSizes: entries.map(e => e.request.bodySize),
      responseSizes: entries.map(e => e.response.bodySize),
      averageRequestSize: this.average(entries.map(e => e.request.bodySize)),
      averageResponseSize: this.average(entries.map(e => e.response.bodySize)),
      
      // URL 分析
      uniqueHosts: new Set(entries.map(e => new URL(e.request.url).hostname)).size,
      httpsMethods: this.groupBy(entries.map(e => e.request.method)),
      
      // 建议生成
      recommendations: this.generateRecommendations(entries)
    };

    return performance;
  }

  private generateRecommendations(entries: HAREntry[]): string[] {
    const recommendations: string[] = [];
    const responseTimes = entries.map(e => e.time);
    const avgResponseTime = this.average(responseTimes);
    const errorRate = this.calculateErrorRate(entries.map(e => e.response.status));

    if (avgResponseTime > 1000) {
      recommendations.push('平均响应时间超过1秒，建议优化服务器性能');
    }

    if (errorRate > 5) {
      recommendations.push(`错误率为 ${errorRate.toFixed(2)}%，建议检查服务器日志`);
    }

    const largeResponses = entries.filter(e => e.response.bodySize > 1024 * 1024);
    if (largeResponses.length > 0) {
      recommendations.push(`发现 ${largeResponses.length} 个大于 1MB 的响应，建议启用压缩`);
    }

    const slowDns = entries.filter(e => (e.timings.dns || 0) > 100);
    if (slowDns.length > entries.length * 0.1) {
      recommendations.push('DNS 解析时间较长，建议使用更快的 DNS 服务器');
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，无明显问题');
    }

    return recommendations;
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateErrorRate(statusCodes: number[]): number {
    const errorCount = statusCodes.filter(code => code >= 400).length;
    return statusCodes.length > 0 ? (errorCount / statusCodes.length) * 100 : 0;
  }

  private groupBy<T>(array: T[]): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = String(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
```

#### 2.4.3 PCAP 分析器
```typescript
export class PCAPAnalyzer {
  analyze(pcapData: PCAPData): NetworkMetrics {
    const packets = pcapData.packets;
    
    return {
      totalPackets: packets.length,
      totalBytes: packets.reduce((sum, p) => sum + p.size, 0),
      averagePacketSize: packets.reduce((sum, p) => sum + p.size, 0) / packets.length,
      
      // 协议分析
      protocolDistribution: pcapData.statistics.protocolDistribution,
      
      // IP 分析
      uniqueSourceIPs: new Set(packets.map(p => p.sourceIP)).size,
      uniqueDestinationIPs: new Set(packets.map(p => p.destinationIP)).size,
      topSourceIPs: this.getTopItems(pcapData.statistics.ipDistribution, 10),
      
      // 端口分析
      topPorts: this.getTopItems(pcapData.statistics.portDistribution, 10),
      
      // 时间分析
      trafficOverTime: this.analyzeTrafficOverTime(packets),
      peakTrafficTime: this.findPeakTrafficTime(packets),
      
      // 安全分析 (简化)
      suspiciousActivities: this.detectSuspiciousActivities(packets),
      portScans: this.detectPortScans(packets),
      
      // 建议
      recommendations: this.generateNetworkRecommendations(packets)
    };
  }

  private getTopItems(distribution: Record<string, number>, limit: number): Array<{item: string, count: number}> {
    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  }

  private analyzeTrafficOverTime(packets: PacketInfo[]): Array<{timestamp: Date, bytes: number}> {
    // 按分钟分组统计流量
    const minuteGroups = new Map<string, number>();
    
    packets.forEach(packet => {
      const minute = new Date(packet.timestamp);
      minute.setSeconds(0, 0);
      const key = minute.toISOString();
      
      minuteGroups.set(key, (minuteGroups.get(key) || 0) + packet.size);
    });

    return Array.from(minuteGroups.entries())
      .map(([timestamp, bytes]) => ({ timestamp: new Date(timestamp), bytes }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private detectSuspiciousActivities(packets: PacketInfo[]): string[] {
    const suspicious: string[] = [];
    
    // 检测异常大量连接
    const connectionCounts = new Map<string, number>();
    packets.forEach(packet => {
      const key = `${packet.sourceIP}->${packet.destinationIP}`;
      connectionCounts.set(key, (connectionCounts.get(key) || 0) + 1);
    });

    for (const [connection, count] of connectionCounts) {
      if (count > 1000) {
        suspicious.push(`异常高频连接: ${connection} (${count} 次)`);
      }
    }

    return suspicious;
  }

  private detectPortScans(packets: PacketInfo[]): string[] {
    const scans: string[] = [];
    const portsByIP = new Map<string, Set<number>>();

    packets.forEach(packet => {
      if (packet.destinationPort) {
        if (!portsByIP.has(packet.sourceIP)) {
          portsByIP.set(packet.sourceIP, new Set());
        }
        portsByIP.get(packet.sourceIP)!.add(packet.destinationPort);
      }
    });

    for (const [ip, ports] of portsByIP) {
      if (ports.size > 50) {
        scans.push(`可能的端口扫描: ${ip} 访问了 ${ports.size} 个不同端口`);
      }
    }

    return scans;
  }

  private generateNetworkRecommendations(packets: PacketInfo[]): string[] {
    const recommendations: string[] = [];
    
    const totalBytes = packets.reduce((sum, p) => sum + p.size, 0);
    const avgPacketSize = totalBytes / packets.length;

    if (avgPacketSize < 100) {
      recommendations.push('平均包大小较小，可能存在网络效率问题');
    }

    const tcpPackets = packets.filter(p => p.protocol === 'TCP').length;
    const udpPackets = packets.filter(p => p.protocol === 'UDP').length;
    
    if (udpPackets > tcpPackets * 2) {
      recommendations.push('UDP 流量占比较高，注意检查是否为正常业务流量');
    }

    if (recommendations.length === 0) {
      recommendations.push('网络流量模式正常');
    }

    return recommendations;
  }
}
```

### 2.5 任务队列服务

#### 2.5.1 简化的队列实现
```typescript
import Bull from 'bull';
import Redis from 'ioredis';

// 任务类型定义
interface FileProcessingJob {
  fileId: string;
  filePath: string;
  fileType: 'har' | 'pcap';
}

export class QueueService {
  private fileQueue: Bull.Queue<FileProcessingJob>;
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.fileQueue = new Bull('file processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.setupQueueProcessors();
  }

  async addFileProcessingJob(jobData: FileProcessingJob): Promise<void> {
    await this.fileQueue.add('process-file', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  private setupQueueProcessors(): void {
    this.fileQueue.process('process-file', async (job) => {
      const { fileId, filePath, fileType } = job.data;
      
      try {
        // 更新状态为处理中
        await this.updateFileStatus(fileId, 'processing');
        
        // 执行解析
        const parseResult = await this.parseFile(filePath, fileType);
        
        // 执行分析
        const analysisResult = await this.analyzeFile(parseResult);
        
        // 保存结果
        await this.saveAnalysisResult(fileId, analysisResult);
        
        // 更新状态为完成
        await this.updateFileStatus(fileId, 'completed');
        
        // 发送通知 (可选)
        await this.sendCompletionNotification(fileId);
        
      } catch (error) {
        // 更新状态为失败
        await this.updateFileStatus(fileId, 'failed', error.message);
        throw error;
      }
    });
  }

  private async parseFile(filePath: string, fileType: 'har' | 'pcap'): Promise<ParseResult> {
    if (fileType === 'har') {
      const harParser = new HARParser();
      const harData = await harParser.parse(filePath);
      return {
        fileType: 'har',
        data: harData,
        summary: {
          totalRecords: harData.entries.length,
          timeRange: this.getHARTimeRange(harData),
          dataSize: this.calculateHARDataSize(harData)
        }
      };
    } else {
      const pcapParser = new PCAPParser();
      const pcapData = await pcapParser.parse(filePath);
      return {
        fileType: 'pcap',
        data: pcapData,
        summary: {
          totalRecords: pcapData.totalPackets,
          timeRange: this.getPCAPTimeRange(pcapData),
          dataSize: pcapData.packets.reduce((sum, p) => sum + p.size, 0)
        }
      };
    }
  }

  private async analyzeFile(parseResult: ParseResult): Promise<AnalysisResult> {
    if (parseResult.fileType === 'har') {
      const analyzer = new HARAnalyzer();
      const performance = analyzer.analyze(parseResult.data as HARData);
      
      return {
        fileId: parseResult.fileId,
        analyzedAt: new Date(),
        summary: {
          fileType: 'har',
          totalRecords: parseResult.summary.totalRecords,
          timeSpan: parseResult.summary.timeRange.end.getTime() - parseResult.summary.timeRange.start.getTime(),
          dataVolume: parseResult.summary.dataSize,
          keyFindings: performance.recommendations.slice(0, 3),
          riskLevel: performance.errorRate > 10 ? 'high' : performance.errorRate > 5 ? 'medium' : 'low'
        },
        performance,
        charts: this.generateHARCharts(performance)
      };
    } else {
      const analyzer = new PCAPAnalyzer();
      const network = analyzer.analyze(parseResult.data as PCAPData);
      
      return {
        fileId: parseResult.fileId,
        analyzedAt: new Date(),
        summary: {
          fileType: 'pcap',
          totalRecords: parseResult.summary.totalRecords,
          timeSpan: parseResult.summary.timeRange.end.getTime() - parseResult.summary.timeRange.start.getTime(),
          dataVolume: parseResult.summary.dataSize,
          keyFindings: network.recommendations.slice(0, 3),
          riskLevel: network.suspiciousActivities.length > 0 ? 'high' : 'low'
        },
        network,
        charts: this.generatePCAPCharts(network)
      };
    }
  }
}
```

## 3. 数据存储简化

### 3.1 PostgreSQL 数据库设计
```sql
-- 用户表 (简化)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- 文件表
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('har', 'pcap')),
    file_size BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
    error_message TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- 分析结果表 (简化)
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    analysis_type VARCHAR(20) NOT NULL, -- 'performance' or 'network'
    summary_data JSONB NOT NULL,
    detailed_data JSONB NOT NULL,
    chart_data JSONB NOT NULL,
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表 (简化)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建必要的索引
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_analysis_results_file_id ON analysis_results(file_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

### 3.2 Redis 缓存策略
```typescript
// 缓存服务 (简化)
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // 用户会话缓存
  async setUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await this.redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData));
  }

  async getUserSession(userId: string): Promise<any> {
    const data = await this.redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // 文件处理状态缓存
  async setFileStatus(fileId: string, status: string, ttl: number = 3600): Promise<void> {
    await this.redis.setex(`file:status:${fileId}`, ttl, status);
  }

  async getFileStatus(fileId: string): Promise<string | null> {
    return await this.redis.get(`file:status:${fileId}`);
  }

  // 分析结果缓存
  async setAnalysisResult(fileId: string, result: any, ttl: number = 7200): Promise<void> {
    await this.redis.setex(`analysis:${fileId}`, ttl, JSON.stringify(result));
  }

  async getAnalysisResult(fileId: string): Promise<any> {
    const data = await this.redis.get(`analysis:${fileId}`);
    return data ? JSON.parse(data) : null;
  }

  // 清理过期数据
  async cleanup(): Promise<void> {
    const expiredSessions = await this.redis.keys('session:*');
    const expiredStatuses = await this.redis.keys('file:status:*');
    
    // 批量删除过期键
    if (expiredSessions.length > 0) {
      await this.redis.del(...expiredSessions);
    }
    if (expiredStatuses.length > 0) {
      await this.redis.del(...expiredStatuses);
    }
  }
}
```

## 4. 部署配置简化

### 4.1 Docker Compose 部署
```yaml
# docker-compose.yml (简化生产版)
version: '3.8'

services:
  # 主应用
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://netinsight:password@db:5432/netinsight
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - UPLOAD_DIR=/app/uploads
    volumes:
      - app_uploads:/app/uploads
      - app_reports:/app/reports
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL 数据库
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=netinsight
      - POSTGRES_USER=netinsight
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis 缓存
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  app_uploads:
  app_reports:
```

### 4.2 环境配置
```bash
# .env.production
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://netinsight:your_db_password@localhost:5432/netinsight

# Redis 配置
REDIS_URL=redis://localhost:6379

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600  # 100MB
ALLOWED_FILE_TYPES=.har,.pcap,.pcapng

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# 监控配置 (可选)
ENABLE_METRICS=true
METRICS_PORT=9090
```

## 5. 开发计划 (现实版)

### 5.1 Phase 1: 基础功能 (4周)
- **Week 1-2**: 项目搭建、用户认证、数据库设计
- **Week 3-4**: 文件上传、基础 HAR 解析

### 5.2 Phase 2: 核心分析 (6周)  
- **Week 5-6**: HAR 性能分析、基础可视化
- **Week 7-8**: PCAP 解析和网络分析
- **Week 9-10**: 报告生成、图表优化

### 5.3 Phase 3: 完善功能 (4周)
- **Week 11-12**: 任务队列、缓存优化
- **Week 13-14**: 错误处理、用户体验优化

### 5.4 Phase 4: 测试部署 (2周)
- **Week 15**: 完整测试、性能优化
- **Week 16**: 生产部署、文档完善

### 5.5 技术债务控制
- 定期代码审查
- 自动化测试覆盖
- 性能监控
- 用户反馈收集

这个简化版本更适合小团队实施，避免了过度工程化的问题，专注于核心功能的快速实现和迭代。