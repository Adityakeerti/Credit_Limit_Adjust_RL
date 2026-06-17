import React from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './Chart.css'

const Chart = ({ 
  data = [], 
  type = 'line',
  xKey = 'date',
  yKeys = [],
  colors = [],
  height = 300,
  showLegend = true
}) => {
  const defaultColors = [
    '#10b981',
    '#2c5282',
    '#f59e0b',
    '#14b8a6'
  ]

  const chartColors = colors.length > 0 ? colors : defaultColors

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height }}>
        <p>No data available for chart</p>
      </div>
    )
  }

  const gridColor = '#e2e8f0'
  const textColor = '#718096'
  const bgWhite = '#ffffff'
  const borderColor = '#e2e8f0'
  const shadowMd = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'

  return (
    <div className="chart-container" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey={xKey} 
              stroke={textColor}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              stroke={textColor}
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: bgWhite,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                boxShadow: shadowMd
              }}
            />
            {showLegend && <Legend />}
            {yKeys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[idx % chartColors.length]}
                fill={chartColors[idx % chartColors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey={xKey} 
              stroke={textColor}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              stroke={textColor}
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: bgWhite,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                boxShadow: shadowMd
              }}
            />
            {showLegend && <Legend />}
            {yKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[idx % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default Chart

