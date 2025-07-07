/**
 * 智能存储管理器
 * 支持多层存储架构，优化用户体验
 */

import type { AnalysisResult, AnalysisRecord } from '@/types/har';

// 存储配置接口
export interface StorageConfig {
  maxCacheSize: number; // MB
  maxHistoryCount: number;
  compressionEnabled: boolean;
  preferredStorage: 'indexeddb' | 'localstorage' | 'memory';
  autoCleanup: boolean;
}

// 默认配置
const DEFAULT_CONFIG: StorageConfig = {
  maxCacheSize: 100, // 100MB
  maxHistoryCount: 50,
  compressionEnabled: true,
  preferredStorage: 'indexeddb',
  autoCleanup: true
};

// 存储项接口
interface StorageItem {
  id: string;
  data: AnalysisResult;
  metadata: {
    size: number;
    compressed: boolean;
    lastAccessed: number;
    accessCount: number;
  };
}

// 历史记录索引接口（与 AnalysisRecord 兼容）
interface HistoryIndex {
  id: string;
  fileName: string;
  fileSize: number;
  analyzedAt: Date;
  summary: any;
  storageLocation: 'indexeddb' | 'localstorage' | 'memory';
  hasFullData: boolean;
  lastAccessed: number;
  priority: 'high' | 'medium' | 'low';
}

class StorageManager {
  private config: StorageConfig;
  private dbName = 'har-analyzer-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, AnalysisResult>();
  private historyIndex: HistoryIndex[] = [];

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadHistoryIndex();
    this.initIndexedDB();
  }

  // 初始化 IndexedDB
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建存储对象
        if (!db.objectStoreNames.contains('analysis-results')) {
          const store = db.createObjectStore('analysis-results', { keyPath: 'id' });
          store.createIndex('lastAccessed', 'metadata.lastAccessed');
          store.createIndex('size', 'metadata.size');
        }
      };
    });
  }

  // 压缩数据
  private async compressData(data: AnalysisResult): Promise<string> {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(data);
    }

    // 使用 LZ-string 或类似压缩算法
    // 这里简化为JSON.stringify，实际项目中可以使用更好的压缩算法
    const jsonString = JSON.stringify(data);
    
    // 模拟压缩效果 - 实际应该使用真正的压缩库
    try {
      // 可以集成 lz-string, pako 等压缩库
      return jsonString;
    } catch (error) {
      console.warn('Compression failed, using raw data:', error);
      return jsonString;
    }
  }

  // 解压数据
  private async decompressData(compressedData: string, isCompressed: boolean): Promise<AnalysisResult> {
    if (!isCompressed) {
      return JSON.parse(compressedData);
    }

    try {
      // 解压逻辑 - 实际应该使用真正的解压缩库
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error('数据解压失败');
    }
  }

  // 计算数据大小（字节）
  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  // 保存分析结果
  async saveAnalysisResult(record: AnalysisRecord, analysisResult: AnalysisResult): Promise<void> {
    const dataSize = this.calculateSize(analysisResult);
    const id = record.id;

    // 更新历史记录索引
    const historyItem: HistoryIndex = {
      id,
      fileName: record.fileName,
      fileSize: record.fileSize,
      analyzedAt: record.analyzedAt,
      summary: record.summary,
      storageLocation: 'memory',
      hasFullData: true,
      lastAccessed: Date.now(),
      priority: 'high'
    };

    // 内存缓存（最快访问）
    this.memoryCache.set(id, analysisResult);

    try {
      // IndexedDB 存储（持久化）
      if (this.db && this.config.preferredStorage === 'indexeddb') {
        await this.saveToIndexedDB(id, analysisResult, dataSize);
        historyItem.storageLocation = 'indexeddb';
      } else {
        // 降级到 localStorage
        await this.saveToLocalStorage(id, analysisResult, dataSize);
        historyItem.storageLocation = 'localstorage';
      }
    } catch (error) {
      console.warn('主存储失败，使用内存存储:', error);
      historyItem.storageLocation = 'memory';
    }

    // 更新历史记录索引
    this.updateHistoryIndex(historyItem);
    
    // 执行清理策略
    if (this.config.autoCleanup) {
      await this.performCleanup();
    }
  }

  // 保存到 IndexedDB
  private async saveToIndexedDB(id: string, data: AnalysisResult, size: number): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not available');

    const compressedData = await this.compressData(data);
    const storageItem: StorageItem = {
      id,
      data: JSON.parse(compressedData), // 存储解析后的对象
      metadata: {
        size,
        compressed: this.config.compressionEnabled,
        lastAccessed: Date.now(),
        accessCount: 1
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysis-results'], 'readwrite');
      const store = transaction.objectStore('analysis-results');
      const request = store.put(storageItem);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 保存到 localStorage
  private async saveToLocalStorage(id: string, data: AnalysisResult, size: number): Promise<void> {
    try {
      const compressedData = await this.compressData(data);
      const storageItem = {
        data: compressedData,
        metadata: {
          size,
          compressed: this.config.compressionEnabled,
          lastAccessed: Date.now(),
          accessCount: 1
        }
      };
      
      localStorage.setItem(`har-analysis-${id}`, JSON.stringify(storageItem));
    } catch (error) {
      // localStorage 可能已满
      console.warn('localStorage full, attempting cleanup:', error);
      await this.cleanupLocalStorage();
      // 重试一次
      const compressedData = await this.compressData(data);
      localStorage.setItem(`har-analysis-${id}`, JSON.stringify(compressedData));
    }
  }

  // 加载分析结果
  async loadAnalysisResult(id: string): Promise<AnalysisResult | null> {
    // 更新访问时间
    this.updateAccessTime(id);

    // 1. 先从内存缓存查找
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id)!;
    }

    // 2. 从持久化存储加载
    const historyItem = this.historyIndex.find(item => item.id === id);
    if (!historyItem) return null;

    let analysisResult: AnalysisResult | null = null;

    try {
      switch (historyItem.storageLocation) {
        case 'indexeddb':
          analysisResult = await this.loadFromIndexedDB(id);
          break;
        case 'localstorage':
          analysisResult = await this.loadFromLocalStorage(id);
          break;
        default:
          return null;
      }

      // 加载成功后缓存到内存
      if (analysisResult) {
        this.memoryCache.set(id, analysisResult);
      }

      return analysisResult;
    } catch (error) {
      console.error(`Failed to load analysis result ${id}:`, error);
      return null;
    }
  }

  // 从 IndexedDB 加载
  private async loadFromIndexedDB(id: string): Promise<AnalysisResult | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analysis-results'], 'readonly');
      const store = transaction.objectStore('analysis-results');
      const request = store.get(id);
      
      request.onsuccess = async () => {
        if (request.result) {
          const storageItem: StorageItem = request.result;
          // 更新访问统计
          await this.updateAccessStats(id);
          resolve(storageItem.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 从 localStorage 加载
  private async loadFromLocalStorage(id: string): Promise<AnalysisResult | null> {
    try {
      const stored = localStorage.getItem(`har-analysis-${id}`);
      if (!stored) return null;
      
      const storageItem = JSON.parse(stored);
      return await this.decompressData(storageItem.data, storageItem.metadata?.compressed || false);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  // 获取历史记录列表
  getHistoryList(): HistoryIndex[] {
    return [...this.historyIndex].sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  // 删除历史记录
  async deleteHistoryItem(id: string): Promise<void> {
    // 从内存删除
    this.memoryCache.delete(id);
    
    // 从 IndexedDB 删除
    if (this.db) {
      const transaction = this.db.transaction(['analysis-results'], 'readwrite');
      const store = transaction.objectStore('analysis-results');
      store.delete(id);
    }
    
    // 从 localStorage 删除
    localStorage.removeItem(`har-analysis-${id}`);
    
    // 从索引删除
    this.historyIndex = this.historyIndex.filter(item => item.id !== id);
    this.saveHistoryIndex();
  }

  // 清空所有历史记录
  async clearAllHistory(): Promise<void> {
    // 清空内存
    this.memoryCache.clear();
    
    // 清空 IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['analysis-results'], 'readwrite');
      const store = transaction.objectStore('analysis-results');
      store.clear();
    }
    
    // 清空 localStorage 中的分析数据
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('har-analysis-')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 清空索引
    this.historyIndex = [];
    this.saveHistoryIndex();
  }

  // 更新历史记录索引
  private updateHistoryIndex(item: HistoryIndex): void {
    const existingIndex = this.historyIndex.findIndex(h => h.id === item.id);
    if (existingIndex >= 0) {
      this.historyIndex[existingIndex] = item;
    } else {
      this.historyIndex.unshift(item);
    }
    
    // 限制历史记录数量
    if (this.historyIndex.length > this.config.maxHistoryCount) {
      const removed = this.historyIndex.splice(this.config.maxHistoryCount);
      // 删除多余的数据
      removed.forEach(item => this.deleteHistoryItem(item.id));
    }
    
    this.saveHistoryIndex();
  }

  // 保存历史记录索引
  private saveHistoryIndex(): void {
    try {
      localStorage.setItem('har-analyzer-history-index', JSON.stringify(this.historyIndex));
    } catch (error) {
      console.error('Failed to save history index:', error);
    }
  }

  // 加载历史记录索引
  private loadHistoryIndex(): void {
    try {
      const stored = localStorage.getItem('har-analyzer-history-index');
      if (stored) {
        this.historyIndex = JSON.parse(stored).map((item: any) => ({
          ...item,
          analyzedAt: new Date(item.analyzedAt) // 恢复 Date 对象
        }));
      }
    } catch (error) {
      console.error('Failed to load history index:', error);
      this.historyIndex = [];
    }
  }

  // 更新访问时间
  private updateAccessTime(id: string): void {
    const item = this.historyIndex.find(h => h.id === id);
    if (item) {
      item.lastAccessed = Date.now();
      this.saveHistoryIndex();
    }
  }

  // 更新访问统计
  private async updateAccessStats(id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['analysis-results'], 'readwrite');
    const store = transaction.objectStore('analysis-results');
    const request = store.get(id);
    
    request.onsuccess = () => {
      if (request.result) {
        const item: StorageItem = request.result;
        item.metadata.lastAccessed = Date.now();
        item.metadata.accessCount += 1;
        store.put(item);
      }
    };
  }

  // 执行清理策略
  private async performCleanup(): Promise<void> {
    await this.cleanupMemoryCache();
    await this.cleanupIndexedDB();
    await this.cleanupLocalStorage();
  }

  // 清理内存缓存
  private async cleanupMemoryCache(): Promise<void> {
    // 保留最近访问的前20个
    const recent = this.historyIndex
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, 20)
      .map(item => item.id);
    
    // 清理其他的内存缓存
    for (const [id] of this.memoryCache) {
      if (!recent.includes(id)) {
        this.memoryCache.delete(id);
      }
    }
  }

  // 清理 IndexedDB
  private async cleanupIndexedDB(): Promise<void> {
    if (!this.db) return;
    
    // 实现 LRU 清理策略
    // 这里可以根据存储大小和访问频率进行智能清理
  }

  // 清理 localStorage
  private async cleanupLocalStorage(): Promise<void> {
    // 清理最老的数据以腾出空间
    const oldItems = this.historyIndex
      .filter(item => item.storageLocation === 'localstorage')
      .sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // 删除最老的25%
    const toDelete = oldItems.slice(0, Math.floor(oldItems.length * 0.25));
    for (const item of toDelete) {
      localStorage.removeItem(`har-analysis-${item.id}`);
      item.hasFullData = false;
    }
  }

  // 获取存储统计信息
  getStorageStats(): Promise<{
    totalSize: number;
    itemCount: number;
    memoryCount: number;
    indexedDBCount: number;
    localStorageCount: number;
  }> {
    return new Promise(resolve => {
      let totalSize = 0;
      let indexedDBCount = 0;
      
      const memoryCount = this.memoryCache.size;
      const localStorageCount = this.historyIndex.filter(item => 
        item.storageLocation === 'localstorage'
      ).length;
      
      if (this.db) {
        const transaction = this.db.transaction(['analysis-results'], 'readonly');
        const store = transaction.objectStore('analysis-results');
        const request = store.getAll();
        
        request.onsuccess = () => {
          indexedDBCount = request.result.length;
          totalSize = request.result.reduce((sum, item: StorageItem) => 
            sum + item.metadata.size, 0
          );
          
          resolve({
            totalSize,
            itemCount: this.historyIndex.length,
            memoryCount,
            indexedDBCount,
            localStorageCount
          });
        };
      } else {
        resolve({
          totalSize: 0,
          itemCount: this.historyIndex.length,
          memoryCount,
          indexedDBCount: 0,
          localStorageCount
        });
      }
    });
  }

  // 更新配置
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('har-analyzer-storage-config', JSON.stringify(this.config));
  }

  // 获取配置
  getConfig(): StorageConfig {
    return { ...this.config };
  }
}

// 创建全局存储管理器实例
export const storageManager = new StorageManager();
export default StorageManager;