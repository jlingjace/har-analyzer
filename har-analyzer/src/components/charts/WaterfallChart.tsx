import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, Empty } from 'antd';
import { useAnalysisResult } from '@/stores/appStore';

interface WaterfallChartProps {
  title?: string;
  height?: number;
}

const WaterfallChart: React.FC<WaterfallChartProps> = ({ 
  title = '请求瀑布图', 
  height = 400 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const analysisResult = useAnalysisResult();

  useEffect(() => {
    if (!chartRef.current || !analysisResult) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);

    // 准备瀑布图数据
    const requests = analysisResult.requests.slowRequests
      .slice(0, 50) // 只显示前50个请求以保持性能
      .map((req, index) => ({
        name: `${req.method} ${req.url.split('/').pop() || req.url}`,
        value: [
          index,
          req.startTime.getTime(),
          req.startTime.getTime() + req.responseTime,
          req.responseTime,
          req.method,
          req.status
        ]
      }));

    const startTime = Math.min(...requests.map(r => r.value[1]));
    const endTime = Math.max(...requests.map(r => r.value[2]));

    const option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          const method = data.value[4];
          const status = data.value[5];
          const duration = Math.round(data.value[3]);
          const start = new Date(data.value[1]).toLocaleTimeString();
          const end = new Date(data.value[2]).toLocaleTimeString();
          
          return `
            <div style="padding: 8px;">
              <div><strong>${data.name}</strong></div>
              <div>方法: ${method}</div>
              <div>状态: ${status}</div>
              <div>持续时间: ${duration}ms</div>
              <div>开始: ${start}</div>
              <div>结束: ${end}</div>
            </div>
          `;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        min: startTime,
        max: endTime,
        axisLabel: {
          formatter: (value: number) => new Date(value).toLocaleTimeString()
        }
      },
      yAxis: {
        type: 'category',
        data: requests.map((_, index) => index),
        axisLabel: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: false
        }
      },
      series: [
        {
          name: '请求时间线',
          type: 'custom',
          renderItem: (params: any, api: any) => {
            const categoryIndex = api.value(0);
            const start = api.coord([api.value(1), categoryIndex]);
            const end = api.coord([api.value(2), categoryIndex]);
            const height = api.size([0, 1])[1] * 0.6;
            
            const method = api.value(4);
            const status = api.value(5);
            
            // 根据状态码确定颜色
            let color = '#1890ff';
            if (status >= 400 && status < 500) {
              color = '#faad14';
            } else if (status >= 500) {
              color = '#f5222d';
            } else if (status >= 200 && status < 300) {
              color = '#52c41a';
            }
            
            // 根据方法确定样式
            const methodColors: Record<string, string> = {
              'GET': '#1890ff',
              'POST': '#52c41a',
              'PUT': '#faad14',
              'DELETE': '#f5222d',
              'PATCH': '#722ed1'
            };
            
            if (methodColors[method]) {
              color = methodColors[method];
            }

            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: start[1] - height / 2,
                width: end[0] - start[0],
                height: height
              },
              style: {
                fill: color,
                opacity: 0.8
              }
            };
          },
          data: requests.map((req, index) => req.value),
          z: 100
        }
      ]
    };

    chartInstance.current.setOption(option);

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [analysisResult, title]);

  if (!analysisResult || analysisResult.requests.slowRequests.length === 0) {
    return (
      <Card>
        <Empty description="暂无请求数据" />
      </Card>
    );
  }

  return (
    <Card title={title}>
      <div ref={chartRef} style={{ height: `${height}px` }} />
    </Card>
  );
};

export default WaterfallChart;