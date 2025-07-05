"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartLineInteractiveProps {
  temperature: number | null
  timestamp: number | null
}

export const description = "Real-time temperature monitoring"

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

export const ChartLineInteractive = ({
  temperature,
  timestamp,
}: ChartLineInteractiveProps) => {
  const [data, setData] = React.useState<TemperatureDataPoint[]>([])
  const [maxDataPoints] = React.useState(60) // Keep last 60 readings
  const activeChart = "temperature" // We only have temperature now

  // Format timestamp to CET timezone
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp * 1000).toLocaleString("en-GB", {
      timeZone: "Europe/Paris",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  // Update chart data when new temperature reading arrives
  React.useEffect(() => {
    if (temperature !== null && timestamp !== null) {
      const date = new Date(timestamp * 1000).toISOString()

      setData(prevData => {
        const newData = [
          ...prevData,
          { date, temperature, timestamp }
        ]

        // Keep only the last maxDataPoints readings
        if (newData.length > maxDataPoints) {
          return newData.slice(-maxDataPoints)
        }
        return newData
      })
    }
  }, [temperature, timestamp, maxDataPoints])

  // Calculate current temperature stats
  const stats = React.useMemo(() => {
    const validData = data.filter(d => d.temperature !== null) as { temperature: number }[]

    if (validData.length === 0) {
      return {
        current: null,
        average: null,
        min: null,
        max: null
      }
    }

    const current = validData[validData.length - 1].temperature
    const sum = validData.reduce((acc, curr) => acc + curr.temperature, 0)
    const average = sum / validData.length
    const min = Math.min(...validData.map(d => d.temperature))
    const max = Math.max(...validData.map(d => d.temperature))

    return {
      current,
      average,
      min,
      max
    }
  }, [data])

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <CardTitle>Temperature Monitor</CardTitle>
          <CardDescription>
            Real-time temperature readings from Bluetooth device
          </CardDescription>
        </div>
        <div className="grid grid-cols-2 gap-1 w-full px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Current</span>
            <span className="text-lg font-bold sm:text-xl">
              {stats.current !== null ? `${stats.current.toFixed(2)} °C` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Average</span>
            <span className="text-lg font-bold sm:text-xl">
              {stats.average !== null ? `${stats.average.toFixed(2)} °C` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Min</span>
            <span className="text-lg font-bold sm:text-xl">
              {stats.min !== null ? `${stats.min.toFixed(2)} °C` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Max</span>
            <span className="text-lg font-bold sm:text-xl">
              {stats.max !== null ? `${stats.max.toFixed(2)} °C` : "N/A"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleTimeString("en-US", {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="temperature"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  }}
                  valueFormatter={(value) => `${value} °C`}
                />
              }
            />
            <Line
              dataKey="temperature"
              type="monotone"
              stroke={`var(--color-temperature)`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} // Disable animation for real-time updates
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
