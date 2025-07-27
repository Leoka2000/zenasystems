"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,

} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,

} from "@/components/ui/chart"
import axios from "axios"

interface ChartLineInteractiveProps {
  temperature: number | null
  timestamp: number | null
}

interface TemperatureDataPoint {
  date: string
  temperature: number | null
  timestamp: number | null
}

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
]

export const ChartLineInteractive = ({
  temperature,
  timestamp,
}: ChartLineInteractiveProps) => {
  const [data, setData] = React.useState<TemperatureDataPoint[]>([])
  const [range, setRange] = React.useState("day")

  // Fetch historical data
  const fetchHistoricalData = React.useCallback(async (selectedRange: string) => {
    try {
      const res = await axios.get(`/api/temperatures?range=${selectedRange}`)
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch history:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchHistoricalData(range)
  }, [range, fetchHistoricalData])

  // Update with real-time data
  React.useEffect(() => {
    if (temperature !== null && timestamp !== null) {
      const newPoint = {
        date: new Date(timestamp * 1000).toISOString(),
        temperature,
        timestamp
      }

      setData(prev => {
        const exists = prev.find(d => d.timestamp === timestamp)
        if (exists) return prev
        return [...prev, newPoint].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      })
    }
  }, [temperature, timestamp])

  const stats = React.useMemo(() => {
    const valid = data.filter(d => d.temperature !== null) as { temperature: number }[]

    if (!valid.length) return { current: null, average: null, min: null, max: null }

    const current = valid[valid.length - 1].temperature
    const average = valid.reduce((acc, val) => acc + val.temperature, 0) / valid.length
    const min = Math.min(...valid.map(d => d.temperature))
    const max = Math.max(...valid.map(d => d.temperature))

    return { current, average, min, max }
  }, [data])

  React.useEffect(() => {
  console.log("Live accelerometer data received:", data)
}, [data])

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex z-10 flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <CardTitle>Temperature Monitor</CardTitle>
          <p className="leading-4 text-sm py-1">Real-time + historical Bluetooth temperature data</p>
        </div>

       <div className="flex flex-col justify-center gap-1 px-6 py-4">
  <label className="text-sm text-muted-foreground mb-1">Range:</label>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="text-sm capitalize">
        {ranges.find(r => r.value === range)?.label}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel>Select Range</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={range} onValueChange={setRange}>
        {ranges.map(r => (
          <DropdownMenuRadioItem key={r.value} value={r.value}>
            {r.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold">{stats.current !== null ? `${stats.current.toFixed(2)} °C` : ""}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-bold">{stats.average !== null ? `${stats.average.toFixed(2)} °C` : ""}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="text-lg font-bold">{stats.min !== null ? `${stats.min.toFixed(2)} °C` : ""}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="text-lg font-bold">{stats.max !== null ? `${stats.max.toFixed(2)} °C` : ""}</p>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
             <YAxis
    tickLine={false}
    axisLine={false}
    tickMargin={8}
    domain={["auto", "auto"]}
    tickFormatter={(value) => `${value}°C`}
  />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-GB", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="temperature"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString("en-GB", {
                      hour12: false, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                    })
                  }
                  valueFormatter={(val) => `${val} °C`}
                />
              }
            />
            <Line
              dataKey="temperature"
              type="monotone"
              stroke={`var(--color-temperature)`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
