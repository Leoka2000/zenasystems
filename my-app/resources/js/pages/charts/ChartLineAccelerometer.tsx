"use client"

import * as React from "react"
import axios from "axios"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  x: { label: "X Axis", color: "var(--chart-1)" },
  y: { label: "Y Axis", color: "var(--chart-2)" },
  z: { label: "Z Axis", color: "var(--chart-3)" },
}

const ranges = [
  { label: "Last 24 hours", value: "day" },
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
  if (liveData && liveData.timestamp) {
    setData((prev) => {
      const exists = prev.some((d) => d.timestamp === liveData.timestamp)
      if (exists) return prev
      return [...prev, liveData].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    })
  }
}, [liveData])

  const stats = React.useMemo(() => {
    if (!data.length) return { current: null }
    const latest = data[data.length - 1]
    return {
      current: latest ? {
        x: latest.x,
        y: latest.y,
        z: latest.z,
      } : null,
    }
  }, [data])

  React.useEffect(() => {
  console.log("Chart data:", data)
}, [data])

  

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex z-10 flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <CardTitle>Accelerometer</CardTitle>
          <p className="leading-4 text-sm py-1">Real-time + historical Bluetooth accelerometer data</p>
        </div>

        <div className="flex flex-col justify-center gap-1 px-6 py-4">
          <label className="text-sm text-muted-foreground mb-1">Range:</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm capitalize">
                {ranges.find((r) => r.value === range)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={range} onValueChange={setRange}>
                {ranges.map((r) => (
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
        <div className="grid grid-cols-3 gap-3 mb-4">
          {stats.current && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">X</p>
                <p className="text-lg font-bold">{stats.current.x}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Y</p>
                <p className="text-lg font-bold">{stats.current.y}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Z</p>
                <p className="text-lg font-bold">{stats.current.z}</p>
              </div>
            </>
          )}
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
           <XAxis
  dataKey="timestamp"
  tickLine={false}
  axisLine={false}
  tickMargin={8}
  minTickGap={32}
  tickFormatter={(value) => {
    const ts = Number(value)
    if (!ts || isNaN(ts)) return "?"
    return new Date(ts * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }}
/>
            <YAxis />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  nameKey="axis"
                
                />
              }
            />
            <Line type="monotone" dataKey="x" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="y" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="z" stroke="var(--chart-3)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
