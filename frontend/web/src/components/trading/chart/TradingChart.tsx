import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, ToggleButtonGroup, ToggleButton, IconButton, Tooltip } from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  ShowChart,
  Candlestick,
  Timeline,
} from '@mui/icons-material';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';

interface TradingChartProps {
  symbol: string;
  data: CandlestickData[];
  height?: number;
}

type ChartType = 'candlestick' | 'line' | 'area';
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const TradingChart: React.FC<TradingChartProps> = ({ symbol, data, height = 500 }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight : height,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b2b' },
        horzLines: { color: '#2b2b2b' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2b2b2b',
      },
      timeScale: {
        borderColor: '#2b2b2b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight : height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, isFullscreen]);

  // Update series based on chart type
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove existing series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    // Create new series based on type
    if (chartType === 'candlestick') {
      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      candlestickSeries.setData(data);
      seriesRef.current = candlestickSeries;
    } else if (chartType === 'line') {
      const lineSeries = chartRef.current.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
      });
      const lineData: LineData[] = data.map(d => ({ time: d.time, value: d.close }));
      lineSeries.setData(lineData);
      seriesRef.current = lineSeries;
    } else if (chartType === 'area') {
      const areaSeries = chartRef.current.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.56)',
        bottomColor: 'rgba(41, 98, 255, 0.04)',
        lineColor: 'rgba(41, 98, 255, 1)',
        lineWidth: 2,
      });
      const areaData: LineData[] = data.map(d => ({ time: d.time, value: d.close }));
      areaSeries.setData(areaData);
      seriesRef.current = areaSeries;
    }

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [chartType, data]);

  const handleChartTypeChange = (_: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
    if (newType) {
      setChartType(newType);
    }
  };

  const handleTimeframeChange = (_: React.MouseEvent<HTMLElement>, newTimeframe: Timeframe | null) => {
    if (newTimeframe) {
      setTimeframe(newTimeframe);
      // TODO: Fetch new data for the selected timeframe
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: isFullscreen ? '100vh' : height,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 1300 : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chart Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Symbol */}
        <Box sx={{ fontWeight: 'bold', fontSize: '16px' }}>
          {symbol}
        </Box>

        {/* Timeframe Selector */}
        <ToggleButtonGroup
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          size="small"
        >
          <ToggleButton value="1m">1m</ToggleButton>
          <ToggleButton value="5m">5m</ToggleButton>
          <ToggleButton value="15m">15m</ToggleButton>
          <ToggleButton value="1h">1h</ToggleButton>
          <ToggleButton value="4h">4h</ToggleButton>
          <ToggleButton value="1d">1D</ToggleButton>
        </ToggleButtonGroup>

        {/* Chart Type Selector */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            <ToggleButton value="candlestick">
              <Tooltip title="Candlestick">
                <Candlestick fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="line">
              <Tooltip title="Line">
                <ShowChart fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="area">
              <Tooltip title="Area">
                <Timeline fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Fullscreen Toggle */}
          <IconButton size="small" onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Box>
      </Box>

      {/* Chart Container */}
      <Box
        ref={chartContainerRef}
        sx={{
          flex: 1,
          position: 'relative',
          bgcolor: '#1a1a1a',
        }}
      />
    </Paper>
  );
};

export default TradingChart;
