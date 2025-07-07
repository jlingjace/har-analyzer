// HAR 文件格式类型定义
export interface HARFile {
  log: HARLog;
}

export interface HARLog {
  version: string;
  creator: HARCreator;
  browser?: HARCreator;
  pages?: HARPage[];
  entries: HAREntry[];
  comment?: string;
}

export interface HARCreator {
  name: string;
  version: string;
  comment?: string;
}

export interface HARPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: HARPageTimings;
  comment?: string;
}

export interface HARPageTimings {
  onContentLoad?: number;
  onLoad?: number;
  comment?: string;
}

export interface HAREntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HARRequest;
  response: HARResponse;
  cache: HARCache;
  timings: HARTimings;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
}

export interface HARRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HARCookie[];
  headers: HARHeader[];
  queryString: HARQueryParam[];
  postData?: HARPostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

export interface HARResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HARCookie[];
  headers: HARHeader[];
  content: HARContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

export interface HARHeader {
  name: string;
  value: string;
  comment?: string;
}

export interface HARCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  comment?: string;
}

export interface HARQueryParam {
  name: string;
  value: string;
  comment?: string;
}

export interface HARPostData {
  mimeType: string;
  text?: string;
  params?: HARParam[];
  comment?: string;
}

export interface HARParam {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
  comment?: string;
}

export interface HARContent {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
}

export interface HARCache {
  beforeRequest?: HARCacheEntry;
  afterRequest?: HARCacheEntry;
  comment?: string;
}

export interface HARCacheEntry {
  expires?: string;
  lastAccess?: string;
  eTag?: string;
  hitCount?: number;
  comment?: string;
}

export interface HARTimings {
  dns?: number;
  connect?: number;
  blocked?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
}

// 分析结果类型定义
export interface AnalysisResult {
  fileInfo: FileInfo;
  summary: AnalysisSummary;
  performance: PerformanceMetrics;
  requests: RequestAnalysis;
  errors: ErrorAnalysis;
  recommendations: string[];
  charts: ChartData;
}

export interface FileInfo {
  fileName: string;
  fileSize: number;
  creator: HARCreator;
  browser?: HARCreator;
  totalEntries: number;
  timeRange: {
    start: Date;
    end: Date;
    duration: number;
  };
}

export interface AnalysisSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalBytes: number;
  uniqueDomains: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface PerformanceMetrics {
  responseTime: {
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
    distribution: number[];
  };
  timing: {
    dns: TimingStats;
    connect: TimingStats;
    send: TimingStats;
    wait: TimingStats;
    receive: TimingStats;
    total: TimingStats;
  };
  size: {
    request: SizeStats;
    response: SizeStats;
    total: SizeStats;
  };
}

export interface TimingStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  total: number;
}

export interface SizeStats {
  min: number;
  max: number;
  avg: number;
  total: number;
}

export interface RequestAnalysis {
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
  byDomain: Record<string, number>;
  byContentType: Record<string, number>;
  slowRequests: SlowRequest[];
  largestRequests: LargeRequest[];
}

export interface SlowRequest {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  size: number;
  startTime: Date;
}

export interface LargeRequest {
  url: string;
  method: string;
  status: number;
  size: number;
  contentType: string;
}

export interface ErrorAnalysis {
  clientErrors: ErrorDetail[];
  serverErrors: ErrorDetail[];
  networkErrors: ErrorDetail[];
  totalErrors: number;
  errorRate: number;
}

export interface ErrorDetail {
  url: string;
  method: string;
  status: number;
  statusText: string;
  responseTime: number;
  startTime: Date;
}

export interface ChartData {
  responseTimeOverTime: TimeSeriesData[];
  statusCodeDistribution: PieChartData[];
  requestsByDomain: BarChartData[];
  sizeDistribution: HistogramData[];
  timingBreakdown: StackedBarData[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface BarChartData {
  name: string;
  value: number;
}

export interface HistogramData {
  range: string;
  count: number;
}

export interface StackedBarData {
  name: string;
  dns: number;
  connect: number;
  send: number;
  wait: number;
  receive: number;
}

// 应用状态类型
export interface AppState {
  harData: HARFile | null;
  analysisResult: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  currentTab: string;
  theme: 'light' | 'dark';
  history: AnalysisRecord[];
}

export interface AnalysisRecord {
  id: string;
  fileName: string;
  fileSize: number;
  analyzedAt: Date;
  summary: AnalysisSummary;
}

// 工具类型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProcessingOptions {
  includeContent: boolean;
  maxEntries: number;
  filterByDomain: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
}