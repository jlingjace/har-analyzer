import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAnalysisResult, useTheme } from '@/stores/appStore';
import type { EChartsOption } from 'echarts';

const DomainChart: React.FC = () => {
  const analysisResult = useAnalysisResult();
  const theme = useTheme();

  const option = useMemo((): EChartsOption => {
    if (!analysisResult) {
      return {};
    }

    const domainData = analysisResult.charts.requestsByDomain;
    const isDark = theme === 'dark';

    return {
      title: {
        text: '域名请求分布',
        left: 'center',
        textStyle: {
          color: isDark ? '#fff' : '#333',
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#333' : '#fff',
        borderColor: isDark ? '#555' : '#ddd',
        textStyle: {
          color: isDark ? '#fff' : '#333'
        },
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const point = params[0];
          return `${point.name}: ${point.value} 个请求`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '请求数量',
        nameTextStyle: {
          color: isDark ? '#ccc' : '#666'
        },
        axisLabel: {
          color: isDark ? '#ccc' : '#666'
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#555' : '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#333' : '#f0f0f0'
          }
        }
      },
      yAxis: {
        type: 'category',
        name: '域名',
        nameTextStyle: {
          color: isDark ? '#ccc' : '#666'
        },
        data: domainData.map(item => {
          // 截断过长的域名
          const domain = item.name;
          return domain.length > 20 ? domain.substring(0, 20) + '...' : domain;
        }),
        axisLabel: {
          color: isDark ? '#ccc' : '#666',
          fontSize: 11
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#555' : '#ddd'
          }
        }
      },
      series: [
        {
          name: '请求数量',
          type: 'bar',
          data: domainData.map((item, index) => ({
            value: item.value,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: '#1890ff'
                  },
                  {
                    offset: 1,
                    color: '#40a9ff'
                  }
                ]
              }
            }
          })),
          barWidth: '60%',
          label: {
            show: true,
            position: 'right',
            color: isDark ? '#ccc' : '#666',
            fontSize: 11
          },
          emphasis: {
            itemStyle: {
              color: '#096dd9'
            }
          }
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

export default DomainChart;