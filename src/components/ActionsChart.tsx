'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ActionData } from '@/lib/logParser'

interface ChartProps {
  data: ActionData[]
}

export default function ActionsChart({ data }: ChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.timestamp).toLocaleDateString(),
  }))

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Actions Over Time</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: '#333',
              borderColor: '#555',
              color: '#fff',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="success"
            stroke="#8884d8"
            name="Success"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="failure" stroke="#82ca9d" name="Failure" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
