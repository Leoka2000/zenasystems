// components/charts/ChartLineAccelerometer.tsx
import React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import axios from "axios"

const ranges = [
  { label: "Last 24h", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
]

export const ChartLineAccelerometer = ({ liveData }) => {
  const [data, setData] = React.useState([])
  const [range, setRange] = React.useState("day")

  const fetchHistory = React.useCallback(async () => {
    try {
      const res = await axios.get(`/api/accelerometers?range=${range}`)
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch accelerometer data:", err)
    }
  }, [range])

  React.useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  React.useEffect(() => {
    if (liveData) {
      setData(prev => {
        const exists = prev.find(d => d.timestamp === liveData.timestamp)
        return exists ? prev : [...prev, liveData]
      })
    }
  }, [liveData])

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Accelerometer</h2>
        <select
          className="text-sm border rounded px-2 py-1 bg-white dark:bg-neutral-800 dark:text-white"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {ranges.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(val) => new Date(val).toLocaleTimeString("en-GB", { hour12: false })}
            minTickGap={20}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value, name) => [`${value}`, name.toUpperCase()]}
          />
          <Legend />
          <Line type="monotone" dataKey="x" stroke="#8884d8" dot={false} />
          <Line type="monotone" dataKey="y" stroke="#82ca9d" dot={false} />
          <Line type="monotone" dataKey="z" stroke="#ffc658" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}