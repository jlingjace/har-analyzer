import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  HARFile, 
  AnalysisResult, 
  AppState, 
  AnalysisRecord 
} from '@/types/har';
import { harParser } from '@/utils/harParser';
import { performanceAnalyzer } from '@/utils/performanceAnalyzer';

interface AppStore extends AppState {
  // 操作方法
  setHarData: (data: HARFile, fileName: string, fileSize: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearData: () => void;
  addToHistory: (record: AnalysisRecord) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (record: AnalysisRecord) => void;
  
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
  history: []
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 设置 HAR 数据并触发分析
        setHarData: (harData, fileName, fileSize) => {
          try {
            set({ loading: true, error: null });
            
            // 执行性能分析
            const analysisResult = performanceAnalyzer.analyze(harData, fileName, fileSize);
            
            // 添加到历史记录
            const record: AnalysisRecord = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              fileName,
              fileSize,
              analyzedAt: new Date(),
              summary: analysisResult.summary
            };
            
            get().addToHistory(record);
            
            set({
              harData,
              analysisResult,
              loading: false,
              currentTab: 'overview'
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
            get().setHarData(harData, file.name, file.size);
            
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : '文件解析失败'
            });
          }
        },

        // 设置加载状态
        setLoading: (loading) => set({ loading }),

        // 设置错误信息
        setError: (error) => set({ error }),

        // 设置当前标签页
        setCurrentTab: (currentTab) => set({ currentTab }),

        // 设置主题
        setTheme: (theme) => set({ theme }),

        // 清除所有数据
        clearData: () => set({
          harData: null,
          analysisResult: null,
          error: null,
          currentTab: 'overview'
        }),

        // 添加到历史记录
        addToHistory: (record) => {
          const currentHistory = get().history;
          const newHistory = [record, ...currentHistory.filter(h => h.id !== record.id)].slice(0, 10);
          set({ history: newHistory });
        },

        // 从历史记录中移除
        removeFromHistory: (id) => {
          const newHistory = get().history.filter(h => h.id !== id);
          set({ history: newHistory });
        },

        // 清空历史记录
        clearHistory: () => set({ history: [] }),

        // 从历史记录加载
        loadFromHistory: (record) => {
          // 这里只能加载摘要信息，实际的 HAR 数据需要重新上传
          set({
            analysisResult: null,
            harData: null,
            error: '请重新上传 HAR 文件以查看完整分析结果',
            currentTab: 'overview'
          });
        },

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
      {
        name: 'har-analyzer-storage',
        partialize: (state) => ({
          theme: state.theme,
          history: state.history
        })
      }
    ),
    { name: 'har-analyzer' }
  )
);

// 导出函数
async function exportToPDF(analysisResult: AnalysisResult): Promise<void> {
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let currentY = margin;

  // 添加标题
  doc.setFontSize(20);
  doc.text('HAR 分析报告', margin, currentY);
  currentY += 20;

  // 文件信息
  doc.setFontSize(16);
  doc.text('文件信息', margin, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.text(`文件名: ${analysisResult.fileInfo.fileName}`, margin, currentY);
  currentY += 8;
  doc.text(`文件大小: ${formatFileSize(analysisResult.fileInfo.fileSize)}`, margin, currentY);
  currentY += 8;
  doc.text(`请求总数: ${analysisResult.summary.totalRequests}`, margin, currentY);
  currentY += 8;
  doc.text(`分析时间: ${analysisResult.fileInfo.timeRange.start.toLocaleString()}`, margin, currentY);
  currentY += 15;

  // 性能摘要
  doc.setFontSize(16);
  doc.text('性能摘要', margin, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.text(`平均响应时间: ${Math.round(analysisResult.performance.responseTime.avg)}ms`, margin, currentY);
  currentY += 8;
  doc.text(`成功请求: ${analysisResult.summary.successfulRequests}`, margin, currentY);
  currentY += 8;
  doc.text(`失败请求: ${analysisResult.summary.failedRequests}`, margin, currentY);
  currentY += 8;
  doc.text(`错误率: ${analysisResult.summary.errorRate.toFixed(2)}%`, margin, currentY);
  currentY += 15;

  // 优化建议
  doc.setFontSize(16);
  doc.text('优化建议', margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  analysisResult.recommendations.forEach((recommendation, index) => {
    if (currentY > 250) { // 换页
      doc.addPage();
      currentY = margin;
    }
    doc.text(`${index + 1}. ${recommendation}`, margin, currentY);
    currentY += 6;
  });

  // 保存文件
  const fileName = `${analysisResult.fileInfo.fileName}_analysis_report.pdf`;
  doc.save(fileName);
}

async function exportToCSV(analysisResult: AnalysisResult): Promise<void> {
  const Papa = await import('papaparse');
  
  // 准备 CSV 数据 - 慢请求
  const csvData = analysisResult.requests.slowRequests.map(req => ({
    'URL': req.url,
    'Method': req.method,
    'Status': req.status,
    'Response Time (ms)': req.responseTime,
    'Size (bytes)': req.size,
    'Start Time': req.startTime.toISOString()
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

// 选择器 hooks
export const useHarData = () => useAppStore(state => state.harData);
export const useAnalysisResult = () => useAppStore(state => state.analysisResult);
export const useLoading = () => useAppStore(state => state.loading);
export const useError = () => useAppStore(state => state.error);
export const useCurrentTab = () => useAppStore(state => state.currentTab);
export const useTheme = () => useAppStore(state => state.theme);
export const useHistory = () => useAppStore(state => state.history);