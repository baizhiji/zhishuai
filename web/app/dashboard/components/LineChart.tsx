'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ChartData {
  day: string;
  users: number;
}

interface LineChartProps {
  data: ChartData[];
}

export default function LineChartComponent({ data }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#d9d9d9' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#d9d9d9' }}
        />
        <Tooltip 
          contentStyle={{ 
            background: '#fff', 
            border: '1px solid #d9d9d9',
            borderRadius: 4
          }}
        />
        <Area 
          type="monotone" 
          dataKey="users" 
          stroke="#52c41a" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorUsers)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
