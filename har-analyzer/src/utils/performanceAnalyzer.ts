import type {
  HARFile,
  HAREntry,
  AnalysisResult,
  PerformanceMetrics,
  RequestAnalysis,
  ErrorAnalysis,
  ChartData,
  SlowRequest,
  LargeRequest,
  ErrorDetail,
  TimingStats,
  SizeStats,
  TimeSeriesData,
  PieChartData,
  BarChartData,
  HistogramData,
  StackedBarData
} from '@/types/har';
import { harParser } from './harParser';

export class PerformanceAnalyzer {
  /**
   * 执行完整的性能分析
   */
  analyze(harData: HARFile, fileName: string, fileSize: number): AnalysisResult {
    const entries = harData.log.entries;
    
    if (entries.length === 0) {
      throw new Error('HAR 文件中没有网络请求数据');
    }

    // 提取文件信息
    const fileInfo = harParser.extractFileInfo(harData, fileName, fileSize);
    
    // 生成快速摘要
    const summary = harParser.generateSummary(harData);
    
    // 性能指标分析
    const performance = this.analyzePerformance(entries);
    
    // 请求分析
    const requests = this.analyzeRequests(entries);
    
    // 错误分析
    const errors = this.analyzeErrors(entries);
    
    // 生成建议
    const recommendations = this.generateRecommendations(entries, performance);
    
    // 生成图表数据
    const charts = this.generateChartData(entries);

    return {
      fileInfo,
      summary,
      performance,
      requests,
      errors,
      recommendations,
      charts
    };
  }

  /**
   * 性能指标分析
   */
  private analyzePerformance(entries: HAREntry[]): PerformanceMetrics {
    const responseTimes = entries.map(e => e.time).filter(t => t >= 0);
    const requestSizes = entries.map(e => e.request.bodySize).filter(s => s >= 0);
    const responseSizes = entries.map(e => e.response.content.size || e.response.bodySize).filter(s => s >= 0);
    
    return {
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: this.calculateAverage(responseTimes),
        median: this.calculateMedian(responseTimes),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
        distribution: this.createDistribution(responseTimes, 10)
      },
      timing: {
        dns: this.calculateTimingStats(entries, 'dns'),
        connect: this.calculateTimingStats(entries, 'connect'),
        send: this.calculateTimingStats(entries, 'send'),
        wait: this.calculateTimingStats(entries, 'wait'),
        receive: this.calculateTimingStats(entries, 'receive'),
        total: this.calculateTimingStats(entries, 'total')
      },
      size: {
        request: this.calculateSizeStats(requestSizes),
        response: this.calculateSizeStats(responseSizes),
        total: this.calculateSizeStats([...requestSizes, ...responseSizes])
      }
    };
  }

  /**
   * 计算时间统计
   */
  private calculateTimingStats(entries: HAREntry[], type: string): TimingStats {
    let values: number[];
    
    switch (type) {
      case 'dns':
        values = entries.map(e => e.timings.dns).filter(v => v !== undefined && v >= 0) as number[];
        break;
      case 'connect':
        values = entries.map(e => e.timings.connect).filter(v => v !== undefined && v >= 0) as number[];
        break;
      case 'send':
        values = entries.map(e => e.timings.send).filter(v => v >= 0);
        break;
      case 'wait':
        values = entries.map(e => e.timings.wait).filter(v => v >= 0);
        break;
      case 'receive':
        values = entries.map(e => e.timings.receive).filter(v => v >= 0);
        break;
      case 'total':
      default:
        values = entries.map(e => e.time).filter(v => v >= 0);
        break;
    }

    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0, total: 0 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: this.calculateAverage(values),
      median: this.calculateMedian(values),
      total: values.reduce((sum, v) => sum + v, 0)
    };
  }

  /**
   * 计算大小统计
   */
  private calculateSizeStats(sizes: number[]): SizeStats {
    if (sizes.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0 };
    }

    return {
      min: Math.min(...sizes),
      max: Math.max(...sizes),
      avg: this.calculateAverage(sizes),
      total: sizes.reduce((sum, s) => sum + s, 0)
    };
  }

  /**
   * 请求分析
   */
  private analyzeRequests(entries: HAREntry[]): RequestAnalysis {
    // 按方法分组
    const byMethod = this.groupBy(entries, e => e.request.method);
    
    // 按状态码分组
    const byStatus = this.groupBy(entries, e => e.response.status.toString());
    
    // 按域名分组
    const byDomain = this.groupBy(entries, e => {
      try {
        return new URL(e.request.url).hostname;
      } catch {
        return 'unknown';
      }
    });
    
    // 按内容类型分组
    const byContentType = this.groupBy(entries, e => {
      const contentType = e.response.content.mimeType || 'unknown';
      return contentType.split(';')[0]; // 移除参数部分
    });

    // 识别慢请求（前10个）
    const slowRequests = this.identifySlowRequests(entries, 10);
    
    // 识别大响应（前10个）
    const largestRequests = this.identifyLargestRequests(entries, 10);

    return {
      byMethod,
      byStatus,
      byDomain,
      byContentType,
      slowRequests,
      largestRequests
    };
  }

  /**
   * 识别慢请求
   */
  private identifySlowRequests(entries: HAREntry[], limit: number): SlowRequest[] {
    return entries
      .filter(e => e.time > 0)
      .sort((a, b) => b.time - a.time)
      .slice(0, limit)
      .map(e => ({
        url: e.request.url,
        method: e.request.method,
        status: e.response.status,
        responseTime: Math.round(e.time * 100) / 100,
        size: e.response.content.size || e.response.bodySize,
        startTime: new Date(e.startedDateTime)
      }));
  }

  /**
   * 识别最大响应
   */
  private identifyLargestRequests(entries: HAREntry[], limit: number): LargeRequest[] {
    return entries
      .filter(e => (e.response.content.size || e.response.bodySize) > 0)
      .sort((a, b) => 
        (b.response.content.size || b.response.bodySize) - 
        (a.response.content.size || a.response.bodySize)
      )
      .slice(0, limit)
      .map(e => ({
        url: e.request.url,
        method: e.request.method,
        status: e.response.status,
        size: e.response.content.size || e.response.bodySize,
        contentType: e.response.content.mimeType || 'unknown'
      }));
  }

  /**
   * 错误分析
   */
  private analyzeErrors(entries: HAREntry[]): ErrorAnalysis {
    const clientErrors = entries
      .filter(e => e.response.status >= 400 && e.response.status < 500)
      .map(e => this.createErrorDetail(e));
    
    const serverErrors = entries
      .filter(e => e.response.status >= 500)
      .map(e => this.createErrorDetail(e));
    
    const networkErrors = entries
      .filter(e => e.response.status === 0 || e.time < 0)
      .map(e => this.createErrorDetail(e));

    const totalErrors = clientErrors.length + serverErrors.length + networkErrors.length;
    const errorRate = entries.length > 0 ? (totalErrors / entries.length) * 100 : 0;

    return {
      clientErrors,
      serverErrors,
      networkErrors,
      totalErrors,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * 创建错误详情
   */
  private createErrorDetail(entry: HAREntry): ErrorDetail {
    return {
      url: entry.request.url,
      method: entry.request.method,
      status: entry.response.status,
      statusText: entry.response.statusText,
      responseTime: Math.round(entry.time * 100) / 100,
      startTime: new Date(entry.startedDateTime)
    };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(entries: HAREntry[], performance: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    // 响应时间建议
    if (performance.responseTime.avg > 1000) {
      recommendations.push(`平均响应时间为 ${Math.round(performance.responseTime.avg)}ms，建议优化服务器性能或使用 CDN`);
    }
    
    if (performance.responseTime.p95 > 3000) {
      recommendations.push(`95% 响应时间超过 3 秒，需要重点优化慢接口`);
    }

    // DNS 建议
    if (performance.timing.dns.avg > 100) {
      recommendations.push(`DNS 解析平均耗时 ${Math.round(performance.timing.dns.avg)}ms，建议使用更快的 DNS 服务器或启用 DNS 预解析`);
    }

    // 连接时间建议
    if (performance.timing.connect.avg > 200) {
      recommendations.push(`连接建立时间较长，建议启用 HTTP/2 或优化网络基础设施`);
    }

    // 大文件建议
    const largeResponses = entries.filter(e => (e.response.content.size || e.response.bodySize) > 1024 * 1024);
    if (largeResponses.length > 0) {
      recommendations.push(`发现 ${largeResponses.length} 个大于 1MB 的响应，建议启用 Gzip 压缩或优化资源大小`);
    }

    // 缓存建议
    const uncachedRequests = entries.filter(e => 
      !e.response.headers.some(h => 
        h.name.toLowerCase() === 'cache-control' || 
        h.name.toLowerCase() === 'expires'
      )
    );
    if (uncachedRequests.length > entries.length * 0.5) {
      recommendations.push('超过 50% 的请求缺少缓存头，建议配置适当的缓存策略');
    }

    // HTTP/2 建议
    const http1Requests = entries.filter(e => 
      e.request.httpVersion.includes('1.1') || e.request.httpVersion.includes('1.0')
    );
    if (http1Requests.length > entries.length * 0.8) {
      recommendations.push('大部分请求使用 HTTP/1.x，建议升级到 HTTP/2 以提升性能');
    }

    // 错误率建议
    const errorRate = (entries.filter(e => e.response.status >= 400).length / entries.length) * 100;
    if (errorRate > 5) {
      recommendations.push(`错误率为 ${Math.round(errorRate * 10) / 10}%，建议检查服务器日志和错误处理逻辑`);
    }

    // 并发连接建议
    const domains = new Set(entries.map(e => {
      try {
        return new URL(e.request.url).hostname;
      } catch {
        return 'unknown';
      }
    }));
    if (domains.size > 10) {
      recommendations.push(`请求涉及 ${domains.size} 个不同域名，可能影响连接复用，建议减少域名数量`);
    }

    return recommendations.length > 0 ? recommendations : ['网络性能表现良好，无明显优化建议'];
  }

  /**
   * 生成图表数据
   */
  private generateChartData(entries: HAREntry[]): ChartData {
    return {
      responseTimeOverTime: this.createTimeSeriesData(entries),
      statusCodeDistribution: this.createStatusCodeDistribution(entries),
      requestsByDomain: this.createDomainDistribution(entries),
      sizeDistribution: this.createSizeDistribution(entries),
      timingBreakdown: this.createTimingBreakdown(entries)
    };
  }

  /**
   * 创建时序数据
   */
  private createTimeSeriesData(entries: HAREntry[]): TimeSeriesData[] {
    return entries
      .filter(e => e.time >= 0)
      .map(e => ({
        timestamp: new Date(e.startedDateTime),
        value: Math.round(e.time * 100) / 100
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * 创建状态码分布
   */
  private createStatusCodeDistribution(entries: HAREntry[]): PieChartData[] {
    const statusGroups = this.groupBy(entries, e => {
      const status = e.response.status;
      if (status >= 200 && status < 300) return '2xx 成功';
      if (status >= 300 && status < 400) return '3xx 重定向';
      if (status >= 400 && status < 500) return '4xx 客户端错误';
      if (status >= 500) return '5xx 服务器错误';
      return '其他';
    });

    const colors = {
      '2xx 成功': '#52c41a',
      '3xx 重定向': '#faad14',
      '4xx 客户端错误': '#fa8c16',
      '5xx 服务器错误': '#f5222d',
      '其他': '#8c8c8c'
    };

    return Object.entries(statusGroups).map(([name, value]) => ({
      name,
      value,
      color: colors[name as keyof typeof colors]
    }));
  }

  /**
   * 创建域名分布
   */
  private createDomainDistribution(entries: HAREntry[]): BarChartData[] {
    const domainGroups = this.groupBy(entries, e => {
      try {
        return new URL(e.request.url).hostname;
      } catch {
        return 'unknown';
      }
    });

    return Object.entries(domainGroups)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }

  /**
   * 创建大小分布
   */
  private createSizeDistribution(entries: HAREntry[]): HistogramData[] {
    const sizes = entries
      .map(e => e.response.content.size || e.response.bodySize)
      .filter(s => s > 0);

    const ranges = [
      { min: 0, max: 1024, label: '< 1KB' },
      { min: 1024, max: 10240, label: '1KB - 10KB' },
      { min: 10240, max: 102400, label: '10KB - 100KB' },
      { min: 102400, max: 1048576, label: '100KB - 1MB' },
      { min: 1048576, max: Infinity, label: '> 1MB' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: sizes.filter(s => s >= range.min && s < range.max).length
    }));
  }

  /**
   * 创建时间分解数据
   */
  private createTimingBreakdown(entries: HAREntry[]): StackedBarData[] {
    // 选择前10个最慢的请求
    const slowestEntries = entries
      .filter(e => e.time > 0)
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);

    return slowestEntries.map(e => {
      const url = new URL(e.request.url);
      const name = url.pathname.split('/').pop() || url.hostname;
      
      return {
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        dns: e.timings.dns || 0,
        connect: e.timings.connect || 0,
        send: e.timings.send || 0,
        wait: e.timings.wait || 0,
        receive: e.timings.receive || 0
      };
    });
  }

  // 工具方法
  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private createDistribution(numbers: number[], buckets: number): number[] {
    if (numbers.length === 0) return new Array(buckets).fill(0);
    
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min;
    const bucketSize = range / buckets;
    
    const distribution = new Array(buckets).fill(0);
    
    numbers.forEach(num => {
      const bucketIndex = Math.min(Math.floor((num - min) / bucketSize), buckets - 1);
      distribution[bucketIndex]++;
    });
    
    return distribution;
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, number> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }
}

// 创建单例实例
export const performanceAnalyzer = new PerformanceAnalyzer();