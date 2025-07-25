// components/SensorDataDisplay.tsx
import React from "react"
import { ChartLineAccelerometer } from "../charts/ChartLineAccelerometer"
import { useBluetoothSensor } from "../../context/useBluetoothSensor"

const SensorDataDisplay = () => {
  const {
    status,
    isConnected,
    data: liveData,
    connectBluetooth,
    disconnectBluetooth,
  } = useBluetoothSensor()

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

      <div className="flex flex-col mb-4 font-sm space-y-2">
        {!isConnected ? (
          <button
            onClick={connectBluetooth}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 z-10 dark:hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow-md"
          >
            Connect to Bluetooth Device
          </button>
        ) : (
          <button
            onClick={disconnectBluetooth}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 z-10 dark:hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg shadow-md"
          >
            Disconnect
          </button>
        )}
      </div>

      <ChartLineAccelerometer liveData={liveData} />
    </div>
  )
}

export default SensorDataDisplay
