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
  temperature: number[]
  timestamp: string[] // ISO format dates or timestamps
}

export const description = "An interactive line chart"

const chartConfig = {
  views: {
    label: "Temperature",
  },
  temperature: {
    label: "Temperature",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export const ChartLineInteractive = ({
  temperature,
  timestamp,
}) => {
  const [activeChart] = React.useState<keyof typeof chartConfig>("temperature")

   React.useEffect(() => {
    console.log("Temperature:", temperature);
    console.log("Timestamp:", timestamp);
  }, [temperature, timestamp]);

const chartData = React.useMemo(() => {
  if (!Array.isArray(temperature) || !Array.isArray(timestamp)) return []
  return timestamp.map((time, index) => ({
    date: time,
    temperature: temperature[index] ?? null,
  }))
}, [temperature, timestamp])


const total = React.useMemo(() => {
  if (!Array.isArray(temperature)) {
    return { temperature: 0 }
  }
  return {
    temperature: temperature.reduce((acc, temp) => acc + temp, 0),
  }
}, [temperature])

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Temperature Over Time</CardTitle>
          <CardDescription>Live temperature chart</CardDescription>
        </div>
        <div className="flex">
          <div
            data-active={true}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
          >
            <span className="text-muted-foreground text-xs">
              {chartConfig.temperature.label}
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {total.temperature.toLocaleString()}
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
            data={chartData}
            margin={{ left: 12, right: 12 }}
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
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="temperature"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Line
              dataKey="temperature"
              type="monotone"
              stroke={`var(--color-temperature)`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
