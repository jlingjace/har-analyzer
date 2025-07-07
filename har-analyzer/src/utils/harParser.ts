import type { 
  HARFile, 
  HAREntry, 
  ValidationResult, 
  ProcessingOptions,
  FileInfo,
  AnalysisSummary
} from '@/types/har';

export class HARParser {
  /**
   * 解析 HAR 文件
   */
  async parseFile(file: File, options: ProcessingOptions = this.getDefaultOptions()): Promise<HARFile> {
    try {
      const content = await this.readFileContent(file);
      const harData = JSON.parse(content);
      
      // 验证 HAR 格式
      const validation = this.validateHAR(harData);
      if (!validation.isValid) {
        throw new Error(`HAR 文件格式错误: ${validation.errors.join(', ')}`);
      }

      // 处理和清洗数据
      const processedData = this.processHARData(harData, options);
      
      return processedData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('文件不是有效的 JSON 格式');
      }
      throw error;
    }
  }

  /**
   * 读取文件内容
   */
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > 50 * 1024 * 1024) { // 50MB 限制
        reject(new Error('文件大小不能超过 50MB'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) {
          reject(new Error('文件读取失败'));
          return;
        }
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取出错'));
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * 验证 HAR 文件格式
   */
  validateHAR(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查基本结构
    if (!data || typeof data !== 'object') {
      errors.push('根对象必须是一个对象');
      return { isValid: false, errors, warnings };
    }

    if (!data.log) {
      errors.push('缺少必需的 log 字段');
      return { isValid: false, errors, warnings };
    }

    const log = data.log;

    // 检查 log 对象
    if (!log.version) {
      errors.push('缺少 HAR 版本信息');
    }

    if (!log.creator || !log.creator.name) {
      errors.push('缺少创建者信息');
    }

    if (!Array.isArray(log.entries)) {
      errors.push('entries 必须是数组');
      return { isValid: false, errors, warnings };
    }

    if (log.entries.length === 0) {
      warnings.push('HAR 文件中没有网络请求记录');
    }

    // 检查 entries 格式
    const invalidEntries = this.validateEntries(log.entries);
    if (invalidEntries.length > 0) {
      warnings.push(`发现 ${invalidEntries.length} 个格式异常的请求记录`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证 entries 数组
   */
  private validateEntries(entries: any[]): number[] {
    const invalidIndices: number[] = [];

    entries.forEach((entry, index) => {
      if (!this.isValidEntry(entry)) {
        invalidIndices.push(index);
      }
    });

    return invalidIndices;
  }

  /**
   * 检查单个 entry 是否有效
   */
  private isValidEntry(entry: any): boolean {
    return !!(
      entry &&
      entry.startedDateTime &&
      typeof entry.time === 'number' &&
      entry.request &&
      entry.response &&
      entry.timings
    );
  }

  /**
   * 处理和清洗 HAR 数据
   */
  private processHARData(harData: any, options: ProcessingOptions): HARFile {
    const log = harData.log;
    
    // 过滤和清洗 entries
    let entries = log.entries.filter((entry: any) => this.isValidEntry(entry));
    
    // 按域名过滤
    if (options.filterByDomain.length > 0) {
      entries = entries.filter((entry: HAREntry) => {
        try {
          const url = new URL(entry.request.url);
          return options.filterByDomain.some(domain => 
            url.hostname.includes(domain)
          );
        } catch {
          return false;
        }
      });
    }

    // 限制数量
    if (options.maxEntries > 0 && entries.length > options.maxEntries) {
      entries = entries.slice(0, options.maxEntries);
    }

    // 清洗和标准化数据
    entries = entries.map((entry: any) => this.normalizeEntry(entry, options));

    return {
      log: {
        version: log.version || '1.2',
        creator: log.creator || { name: 'Unknown', version: '0.0.0' },
        browser: log.browser,
        pages: log.pages,
        entries: entries.sort((a: HAREntry, b: HAREntry) => 
          new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime()
        )
      }
    };
  }

  /**
   * 标准化单个 entry
   */
  private normalizeEntry(entry: any, options: ProcessingOptions): HAREntry {
    const normalized: HAREntry = {
      startedDateTime: entry.startedDateTime,
      time: Math.max(0, entry.time || 0),
      request: {
        method: (entry.request.method || 'GET').toUpperCase(),
        url: entry.request.url || '',
        httpVersion: entry.request.httpVersion || 'HTTP/1.1',
        headers: entry.request.headers || [],
        cookies: entry.request.cookies || [],
        queryString: entry.request.queryString || [],
        headersSize: entry.request.headersSize || -1,
        bodySize: entry.request.bodySize || 0,
        postData: entry.request.postData
      },
      response: {
        status: entry.response.status || 0,
        statusText: entry.response.statusText || '',
        httpVersion: entry.response.httpVersion || 'HTTP/1.1',
        headers: entry.response.headers || [],
        cookies: entry.response.cookies || [],
        content: {
          size: entry.response.content?.size || 0,
          mimeType: entry.response.content?.mimeType || 'unknown',
          text: options.includeContent ? entry.response.content?.text : undefined,
          encoding: entry.response.content?.encoding,
          compression: entry.response.content?.compression
        },
        redirectURL: entry.response.redirectURL || '',
        headersSize: entry.response.headersSize || -1,
        bodySize: entry.response.bodySize || 0
      },
      cache: entry.cache || {},
      timings: {
        dns: this.normalizeTimingValue(entry.timings.dns),
        connect: this.normalizeTimingValue(entry.timings.connect),
        blocked: this.normalizeTimingValue(entry.timings.blocked),
        send: Math.max(0, entry.timings.send || 0),
        wait: Math.max(0, entry.timings.wait || 0),
        receive: Math.max(0, entry.timings.receive || 0),
        ssl: this.normalizeTimingValue(entry.timings.ssl)
      },
      serverIPAddress: entry.serverIPAddress,
      connection: entry.connection,
      pageref: entry.pageref
    };

    return normalized;
  }

  /**
   * 标准化时间值
   */
  private normalizeTimingValue(value: any): number | undefined {
    if (typeof value === 'number' && value >= 0) {
      return value;
    }
    return undefined;
  }

  /**
   * 提取文件基本信息
   */
  extractFileInfo(harData: HARFile, fileName: string, fileSize: number): FileInfo {
    const entries = harData.log.entries;
    const timestamps = entries.map(e => new Date(e.startedDateTime).getTime()).filter(t => !isNaN(t));
    
    const startTime = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const endTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    
    // 计算最后一个请求的结束时间
    const lastRequestEndTime = entries.reduce((maxTime, entry) => {
      const requestTime = new Date(entry.startedDateTime).getTime() + entry.time;
      return Math.max(maxTime, requestTime);
    }, endTime);

    return {
      fileName,
      fileSize,
      creator: harData.log.creator,
      browser: harData.log.browser,
      totalEntries: entries.length,
      timeRange: {
        start: new Date(startTime),
        end: new Date(lastRequestEndTime),
        duration: lastRequestEndTime - startTime
      }
    };
  }

  /**
   * 生成快速摘要
   */
  generateSummary(harData: HARFile): AnalysisSummary {
    const entries = harData.log.entries;
    
    const successfulRequests = entries.filter(e => e.response.status >= 200 && e.response.status < 400).length;
    const failedRequests = entries.length - successfulRequests;
    const totalBytes = entries.reduce((sum, e) => sum + (e.response.content.size || 0), 0);
    const responseTimes = entries.map(e => e.time).filter(t => t > 0);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const uniqueDomains = new Set(
      entries.map(e => {
        try {
          return new URL(e.request.url).hostname;
        } catch {
          return 'unknown';
        }
      })
    ).size;

    return {
      totalRequests: entries.length,
      successfulRequests,
      failedRequests,
      totalBytes,
      uniqueDomains,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: entries.length > 0 ? (failedRequests / entries.length) * 100 : 0
    };
  }

  /**
   * 获取默认处理选项
   */
  private getDefaultOptions(): ProcessingOptions {
    return {
      includeContent: false,
      maxEntries: 10000,
      filterByDomain: []
    };
  }
}

// 创建单例实例
export const harParser = new HARParser();