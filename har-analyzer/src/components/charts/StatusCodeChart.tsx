import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAnalysisResult, useTheme } from '@/stores/appStore';
import type { EChartsOption } from 'echarts';

const StatusCodeChart: React.FC = () => {
  const analysisResult = useAnalysisResult();
  const theme = useTheme();

  const option = useMemo((): EChartsOption => {
    if (!analysisResult) {
      return {};
    }

    const statusData = analysisResult.charts.statusCodeDistribution;
    const isDark = theme === 'dark';

    return {
      title: {
        text: '状态码分布',
        left: 'center',
        textStyle: {
          color: isDark ? '#fff' : '#333',
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#333' : '#fff',
        borderColor: isDark ? '#555' : '#ddd',
        textStyle: {
          color: isDark ? '#fff' : '#333'
        },
        formatter: (params: any) => {
          return `${params.name}: ${params.value} (${params.percent}%)`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        textStyle: {
          color: isDark ? '#ccc' : '#666'
        }
      },
      series: [
        {
          name: '状态码',
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'outside',
            color: isDark ? '#ccc' : '#666',
            formatter: '{b}: {c}'
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: isDark ? '#555' : '#ddd'
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: statusData.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: item.color || '#1890ff'
            }
          }))
        }
      ]
    };
  }, [analysisResult, theme]);

  if (!analysisResult) {
    return <div style={{ textAlign: 'center', padding: 40 }}>暂无数据</div>;
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default StatusCodeChart;