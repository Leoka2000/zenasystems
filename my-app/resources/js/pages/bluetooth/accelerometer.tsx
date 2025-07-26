// components/SensorDataDisplay.tsx
import React from "react"
import { ChartLineAccelerometer } from "../charts/ChartLineAccelerometer"
import { useBluetoothSensor } from "../../context/useBluetoothSensor"

const SensorDataDisplay = () => {
const { accelerometerData: liveData, status } = useBluetoothSensor()

  

  return (
    <div className="p-4 mb-2 dark:bg-neutral-950 h-full rounded-lg shadow-md mx-auto">
      <h1 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-6">
        Bluetooth Accelerometer Data
      </h1>

      <div className="mb-6">
        <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
          Status: <span className="font-semibold">{status}</span>
        </p>
      </div>

     
      <ChartLineAccelerometer liveData={liveData} />
    </div>
  )
}

export default SensorDataDisplay
