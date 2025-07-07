import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  HARFile, 
  AnalysisResult, 
  AppState, 
  AnalysisRecord 
} from '@/types/har';
import { harParser } from '@/utils/harParser';
import { performanceAnalyzer } from '@/utils/performanceAnalyzer';
import { storageManager } from '@/utils/storageManager';
import type { StorageConfig } from '@/utils/storageManager';

interface AppStore extends AppState {
  // 操作方法
  setHarData: (data: HARFile, fileName: string, fileSize: number) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearData: () => void;
  loadFromHistory: (id: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  getHistoryList: () => any[];
  refreshHistoryList: () => void;
  
  // 存储管理
  getStorageStats: () => Promise<any>;
  updateStorageConfig: (config: Partial<StorageConfig>) => void;
  getStorageConfig: () => StorageConfig;
  
  // 异步操作
  analyzeFile: (file: File) => Promise<void>;
  exportData: (format: 'pdf' | 'csv' | 'json') => Promise<void>;
}

const initialState: AppState = {
  harData: null,
  analysisResult: null,
  loading: false,
  error: null,
  currentTab: 'overview',
  theme: 'light',
  history: [] // 这里只存储索引，完整数据由 storageManager 管理
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 设置 HAR 数据并触发分析
      setHarData: async (harData, fileName, fileSize) => {
        try {
          set({ loading: true, error: null });
          
          // 执行性能分析
          const analysisResult = performanceAnalyzer.analyze(harData, fileName, fileSize);
          
          // 创建历史记录
          const record: AnalysisRecord = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileName,
            fileSize,
            analyzedAt: new Date(),
            summary: analysisResult.summary,
            storageLocation: 'memory',
            hasFullData: true,
            lastAccessed: Date.now(),
            priority: 'high'
          };
          
          // 使用新的存储管理器保存数据
          await storageManager.saveAnalysisResult(record, analysisResult);
          
          set({
            harData,
            analysisResult,
            loading: false,
            currentTab: 'overview',
            history: storageManager.getHistoryList() // 更新历史记录列表
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '分析失败'
          });
        }
      },

      // 异步分析文件
      analyzeFile: async (file: File) => {
        try {
          set({ loading: true, error: null });
          
          // 解析 HAR 文件
          const harData = await harParser.parseFile(file);
          
          // 设置数据并分析
          await get().setHarData(harData, file.name, file.size);
          
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '文件解析失败'
          });
        }
      },

      // 从历史记录加载数据
      loadFromHistory: async (id: string) => {
        try {
          set({ loading: true, error: null });
          
          const analysisResult = await storageManager.loadAnalysisResult(id);
          
          if (analysisResult) {
            set({
              analysisResult,
              harData: null, // HAR 原始数据不缓存
              loading: false,
              currentTab: 'overview',
              error: null
            });
          } else {
            set({
              loading: false,
              error: '无法加载分析数据，请重新上传文件'
            });
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '加载失败'
          });
        }
      },

      // 删除历史记录项
      deleteHistoryItem: async (id: string) => {
        try {
          await storageManager.deleteHistoryItem(id);
          set({ history: storageManager.getHistoryList() });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除失败'
          });
        }
      },

      // 清空所有历史记录
      clearAllHistory: async () => {
        try {
          await storageManager.clearAllHistory();
          set({ history: [] });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '清空失败'
          });
        }
      },

      // 获取历史记录列表
      getHistoryList: () => {
        return storageManager.getHistoryList();
      },

      // 刷新历史记录列表
      refreshHistoryList: () => {
        set({ history: storageManager.getHistoryList() });
      },

      // 获取存储统计信息
      getStorageStats: async () => {
        return await storageManager.getStorageStats();
      },

      // 更新存储配置
      updateStorageConfig: (config: Partial<StorageConfig>) => {
        storageManager.updateConfig(config);
      },

      // 获取存储配置
      getStorageConfig: () => {
        return storageManager.getConfig();
      },

      // 设置加载状态
      setLoading: (loading) => set({ loading }),

      // 设置错误信息
      setError: (error) => set({ error }),

      // 设置当前标签页
      setCurrentTab: (currentTab) => set({ currentTab }),

      // 设置主题
      setTheme: (theme) => {
        set({ theme });
        // 持久化主题设置
        localStorage.setItem('har-analyzer-theme', theme);
      },

      // 清除所有数据
      clearData: () => set({
        harData: null,
        analysisResult: null,
        error: null,
        currentTab: 'overview'
      }),

      // 导出数据
      exportData: async (format) => {
        const { analysisResult } = get();
        if (!analysisResult) {
          throw new Error('没有可导出的数据');
        }

        try {
          set({ loading: true });
          
          switch (format) {
            case 'pdf':
              await exportToPDF(analysisResult);
              break;
            case 'csv':
              await exportToCSV(analysisResult);
              break;
            case 'json':
              await exportToJSON(analysisResult);
              break;
            default:
              throw new Error('不支持的导出格式');
          }
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '导出失败' 
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      }
    }),
    { name: 'har-analyzer' }
  )
);

// 在应用启动时初始化历史记录
const initializeStore = () => {
  const store = useAppStore.getState();
  
  // 加载主题设置
  const savedTheme = localStorage.getItem('har-analyzer-theme') as 'light' | 'dark';
  if (savedTheme) {
    store.setTheme(savedTheme);
  }
  
  // 刷新历史记录列表
  store.refreshHistoryList();
};

// 立即初始化
if (typeof window !== 'undefined') {
  initializeStore();
}

// 导出函数
async function exportToPDF(analysisResult: AnalysisResult): Promise<void> {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  
  // 创建一个临时的HTML元素来生成PDF内容
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    width: 800px;
    padding: 40px;
    font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
    background: white;
    color: black;
    line-height: 1.6;
  `;
  
  tempDiv.innerHTML = `
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 30px; text-align: center;">
      HAR 分析报告
    </div>
    
    <!-- 文件信息 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">文件信息</h2>
      <div style="margin: 15px 0;">
        <div style="margin: 8px 0;"><strong>文件名：</strong> ${analysisResult.fileInfo.fileName}</div>
        <div style="margin: 8px 0;"><strong>文件大小：</strong> ${formatFileSize(analysisResult.fileInfo.fileSize)}</div>
        <div style="margin: 8px 0;"><strong>请求总数：</strong> ${analysisResult.summary.totalRequests}</div>
        <div style="margin: 8px 0;"><strong>分析时间：</strong> ${analysisResult.fileInfo.timeRange.start.toLocaleString()}</div>
        <div style="margin: 8px 0;"><strong>数据范围：</strong> ${analysisResult.fileInfo.timeRange.start.toLocaleString()} ~ ${analysisResult.fileInfo.timeRange.end.toLocaleString()}</div>
        <div style="margin: 8px 0;"><strong>持续时间：</strong> ${Math.round(analysisResult.fileInfo.timeRange.duration / 1000)} 秒</div>
      </div>
    </div>
    
    <!-- 性能摘要 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #52c41a; border-bottom: 2px solid #52c41a; padding-bottom: 8px;">性能摘要</h2>
      <div style="margin: 15px 0;">
        <div style="margin: 8px 0;"><strong>平均响应时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.responseTime.avg', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>中位数响应时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.responseTime.median', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>P95 响应时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.responseTime.p95', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>P99 响应时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.responseTime.p99', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>最快响应：</strong> ${Math.round(safeGet(analysisResult, 'performance.responseTime.min', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>最慢响应：</strong> ${Math.round(safeGet(analysisResult, 'performance.responseTime.max', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>成功请求：</strong> ${analysisResult.summary.successfulRequests}</div>
        <div style="margin: 8px 0;"><strong>失败请求：</strong> ${analysisResult.summary.failedRequests}</div>
        <div style="margin: 8px 0;"><strong>错误率：</strong> ${analysisResult.summary.errorRate.toFixed(2)}%</div>
        <div style="margin: 8px 0;"><strong>传输总量：</strong> ${formatFileSize(analysisResult.summary.totalBytes)}</div>
        <div style="margin: 8px 0;"><strong>涉及域名：</strong> ${analysisResult.summary.uniqueDomains} 个</div>
      </div>
    </div>
    
    <!-- 网络时序分析 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #722ed1; border-bottom: 2px solid #722ed1; padding-bottom: 8px;">网络时序分析</h2>
      <div style="margin: 15px 0;">
        <div style="margin: 8px 0;"><strong>DNS 解析平均时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.timing.dns.avg', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>TCP 连接平均时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.timing.connect.avg', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>发送请求平均时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.timing.send.avg', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>等待响应平均时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.timing.wait.avg', 0))}ms</div>
        <div style="margin: 8px 0;"><strong>接收数据平均时间：</strong> ${Math.round(safeGet(analysisResult, 'performance.timing.receive.avg', 0))}ms</div>
      </div>
    </div>
    
    <!-- 请求分析 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #13c2c2; border-bottom: 2px solid #13c2c2; padding-bottom: 8px;">请求分析</h2>
      <div style="margin: 15px 0;">
        <div style="margin: 8px 0;"><strong>平均请求大小：</strong> ${formatFileSize(safeGet(analysisResult, 'performance.size.request.avg', 0))}</div>
        <div style="margin: 8px 0;"><strong>平均响应大小：</strong> ${formatFileSize(safeGet(analysisResult, 'performance.size.response.avg', 0))}</div>
        <div style="margin: 8px 0;"><strong>最大请求大小：</strong> ${formatFileSize(safeGet(analysisResult, 'performance.size.request.max', 0))}</div>
        <div style="margin: 8px 0;"><strong>最大响应大小：</strong> ${formatFileSize(safeGet(analysisResult, 'performance.size.response.max', 0))}</div>
      </div>
    </div>
    
    <!-- 错误分析 -->
    ${(safeGet(analysisResult, 'errors.clientErrors', []) || []).length > 0 || (safeGet(analysisResult, 'errors.serverErrors', []) || []).length > 0 ? `
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #f5222d; border-bottom: 2px solid #f5222d; padding-bottom: 8px;">错误分析</h2>
      <div style="margin: 15px 0;">
        <div style="margin: 8px 0;"><strong>错误总数：</strong> ${safeGet(analysisResult, 'errors.totalErrors', 0)}</div>
        <div style="margin: 8px 0;"><strong>4xx 客户端错误：</strong> ${(safeGet(analysisResult, 'errors.clientErrors', []) || []).length}</div>
        <div style="margin: 8px 0;"><strong>5xx 服务器错误：</strong> ${(safeGet(analysisResult, 'errors.serverErrors', []) || []).length}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background: #fafafa;">
            <th style="border: 1px solid #d9d9d9; padding: 8px; text-align: left;">URL</th>
            <th style="border: 1px solid #d9d9d9; padding: 8px; text-align: left;">状态码</th>
            <th style="border: 1px solid #d9d9d9; padding: 8px; text-align: left;">错误原因</th>
          </tr>
        </thead>
        <tbody>
          ${[...(safeGet(analysisResult, 'errors.clientErrors', []) || []), ...(safeGet(analysisResult, 'errors.serverErrors', []) || [])].slice(0, 10).map((error: any) => 
            `<tr>
              <td style="border: 1px solid #d9d9d9; padding: 8px; max-width: 400px; word-break: break-all;">${error.url}</td>
              <td style="border: 1px solid #d9d9d9; padding: 8px;">${error.status}</td>
              <td style="border: 1px solid #d9d9d9; padding: 8px;">${error.statusText}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <!-- 优化建议 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #fa8c16; border-bottom: 2px solid #fa8c16; padding-bottom: 8px;">优化建议</h2>
      <div style="margin: 15px 0;">
        ${analysisResult.recommendations.map((rec, index) => 
          `<div style="margin: 10px 0; padding: 10px; background: #f6f8fa; border-left: 4px solid #fa8c16;">
            <strong>${index + 1}.</strong> ${rec}
          </div>`
        ).join('')}
      </div>
    </div>
    
    <!-- 慢请求详情 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #f5222d; border-bottom: 2px solid #f5222d; padding-bottom: 8px;">慢请求详情 (前20个)</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px;">
        <thead>
          <tr style="background: #fafafa;">
            <th style="border: 1px solid #d9d9d9; padding: 6px; text-align: left;">URL</th>
            <th style="border: 1px solid #d9d9d9; padding: 6px; text-align: left;">方法</th>
            <th style="border: 1px solid #d9d9d9; padding: 6px; text-align: left;">状态</th>
            <th style="border: 1px solid #d9d9d9; padding: 6px; text-align: left;">响应时间</th>
            <th style="border: 1px solid #d9d9d9; padding: 6px; text-align: left;">大小</th>
          </tr>
        </thead>
        <tbody>
          ${(safeGet(analysisResult, 'requests.slowRequests', []) || []).slice(0, 20).map((req: any) => 
            `<tr>
              <td style="border: 1px solid #d9d9d9; padding: 6px; max-width: 300px; word-break: break-all; font-size: 11px;">${req.url}</td>
              <td style="border: 1px solid #d9d9d9; padding: 6px;">${req.method}</td>
              <td style="border: 1px solid #d9d9d9; padding: 6px;">${req.status}</td>
              <td style="border: 1px solid #d9d9d9; padding: 6px;">${req.responseTime}ms</td>
              <td style="border: 1px solid #d9d9d9; padding: 6px;">${formatFileSize(req.size)}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- 统计信息 -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #595959; border-bottom: 2px solid #595959; padding-bottom: 8px;">统计信息</h2>
      <div style="margin: 15px 0; font-size: 12px; color: #666;">
        <div>报告生成时间：${new Date().toLocaleString()}</div>
        <div>工具版本：HAR Analyzer v2.0</div>
        <div>数据来源：${safeGet(analysisResult, 'fileInfo.creator.name', 'Unknown')} ${safeGet(analysisResult, 'fileInfo.creator.version', '')}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(tempDiv);
  
  try {
    // 生成canvas
    const canvas = await html2canvas.default(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // 创建PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // 如果内容超过一页，添加新页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // 保存文件
    const fileName = `${analysisResult.fileInfo.fileName}_analysis_report.pdf`;
    pdf.save(fileName);
    
  } finally {
    // 清理临时元素
    document.body.removeChild(tempDiv);
  }
}

async function exportToCSV(analysisResult: AnalysisResult): Promise<void> {
  const Papa = await import('papaparse');
  
  // 准备 CSV 数据 - 慢请求
  const csvData = (safeGet(analysisResult, 'requests.slowRequests', []) || []).map((req: any) => ({
    'URL': req.url,
    'Method': req.method,
    'Status': req.status,
    'Response Time (ms)': req.responseTime,
    'Size (bytes)': req.size,
    'Start Time': req.startTime?.toISOString() || ''
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${analysisResult.fileInfo.fileName}_slow_requests.csv`;
  
  // 下载文件
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

async function exportToJSON(analysisResult: AnalysisResult): Promise<void> {
  const jsonData = JSON.stringify(analysisResult, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
  const fileName = `${analysisResult.fileInfo.fileName}_analysis.json`;
  
  // 下载文件
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// 工具函数
function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// 安全获取数值的工具函数
function safeGet(obj: any, path: string, defaultValue: any = 0) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

// 选择器 hooks
export const useHarData = () => useAppStore(state => state.harData);
export const useAnalysisResult = () => useAppStore(state => state.analysisResult);
export const useLoading = () => useAppStore(state => state.loading);
export const useError = () => useAppStore(state => state.error);
export const useCurrentTab = () => useAppStore(state => state.currentTab);
export const useTheme = () => useAppStore(state => state.theme);
export const useHistory = () => useAppStore(state => state.history);