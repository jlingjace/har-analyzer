import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAnalysisResult, useTheme } from '@/stores/appStore';
import type { EChartsOption } from 'echarts';

const ResponseTimeChart: React.FC = () => {
  const analysisResult = useAnalysisResult();
  const theme = useTheme();

  const option = useMemo((): EChartsOption => {
    if (!analysisResult) {
      return {};
    }

    const timeSeriesData = analysisResult.charts.responseTimeOverTime;
    const isDark = theme === 'dark';

    return {
      title: {
        text: '响应时间趋势',
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
        formatter: (params: any) => {
          const point = params[0];
          return `
            <div>
              <div>时间: ${new Date(point.data[0]).toLocaleTimeString()}</div>
              <div>响应时间: ${point.data[1]}ms</div>
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        name: '时间',
        nameTextStyle: {
          color: isDark ? '#ccc' : '#666'
        },
        axisLabel: {
          color: isDark ? '#ccc' : '#666',
          formatter: (value: number) => {
            return new Date(value).toLocaleTimeString();
          }
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#555' : '#ddd'
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#333' : '#f0f0f0'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '响应时间 (ms)',
        nameTextStyle: {
          color: isDark ? '#ccc' : '#666'
        },
        axisLabel: {
          color: isDark ? '#ccc' : '#666',
          formatter: '{value}ms'
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
      series: [
        {
          name: '响应时间',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          data: timeSeriesData.map(d => [d.timestamp.getTime(), d.value]),
          lineStyle: {
            color: '#1890ff',
            width: 2
          },
          itemStyle: {
            color: '#1890ff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(24, 144, 255, 0.2)'
                },
                {
                  offset: 1,
                  color: 'rgba(24, 144, 255, 0.02)'
                }
              ]
            }
          },
          markLine: {
            silent: true,
            lineStyle: {
              color: '#faad14',
              type: 'dashed'
            },
            data: [
              {
                yAxis: analysisResult.performance.responseTime.avg,
                name: '平均值',
                label: {
                  formatter: `平均: ${Math.round(analysisResult.performance.responseTime.avg)}ms`,
                  color: isDark ? '#fff' : '#333'
                }
              }
            ]
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

export default ResponseTimeChart;