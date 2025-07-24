// components/SensorDataDisplay.tsx
import React, { useState, useEffect, useCallback, useRef } from "react"
import api from "./api"
import { ChartLineAccelerometer } from "../charts/ChartLineAccelerometer"

const SERVICE_UUID = "11111111-1111-1111-1111-111111111111"
const READ_NOTIFY_CHARACTERISTIC_UUID = "22222222-2222-2222-2222-222222222222"
const WRITE_CHARACTERISTIC_UUID = "44444444-4444-4444-4444-444444444444"

const SensorDataDisplay = () => {
  const [status, setStatus] = useState("Disconnected")
  const [liveData, setLiveData] = useState(null)
  const [device, setDevice] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  const notifyCharRef = useRef(null)
  const writeCharRef = useRef(null)
  const writeIntervalRef = useRef(null)

  const parseHexData = useCallback((hexString) => {
    const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString
    const timestamp = parseInt(cleanHex.slice(0, 8), 16)
    const x = parseInt(cleanHex.slice(12, 16), 16) << 16 >> 16
    const y = parseInt(cleanHex.slice(16, 20), 16) << 16 >> 16
    const z = parseInt(cleanHex.slice(20, 24), 16) << 16 >> 16
    return { timestamp, x, y, z }
  }, [])

  const handleCharacteristicValueChanged = useCallback(async (event) => {
    const value = event.target.value
    let hexString = "0x"
    for (let i = 0; i < value.byteLength; i++) {
      hexString += ("00" + value.getUint8(i).toString(16)).slice(-2)
    }

    try {
      const { timestamp, x, y, z } = parseHexData(hexString)
      setStatus("Receiving data...")

      await api.post("/accelerometer", { x, y, z, timestamp })

      setLiveData({
        x,
        y,
        z,
        timestamp,
        date: new Date(timestamp * 1000).toISOString(),
      })
    } catch (error) {
      console.error("Error parsing device data:", error)
      setStatus("Failed to process data")
    }
  }, [parseHexData])

  const sendWriteRequest = useCallback(async () => {
    if (!writeCharRef.current) return

    const unixTimestamp = Math.floor(Date.now() / 1000)
    const buffer = new ArrayBuffer(4)
    const view = new DataView(buffer)
    view.setUint32(0, unixTimestamp, false)

    try {
      await writeCharRef.current.writeValue(buffer)
    } catch (error) {
      console.error("Write error:", error)
    }
  }, [])

  const startWriteInterval = useCallback(() => {
    writeIntervalRef.current = setInterval(sendWriteRequest, 5000)
  }, [sendWriteRequest])

  const stopWriteInterval = useCallback(() => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current)
      writeIntervalRef.current = null
    }
  }, [])

  const connectBluetooth = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth not supported")
      return
    }

    try {
      setStatus("Requesting Bluetooth device...")
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      })

      setDevice(selectedDevice)
      setStatus("Connecting to GATT server...")
      const server = await selectedDevice.gatt.connect()

      const service = await server.getPrimaryService(SERVICE_UUID)
      const notifyChar = await service.getCharacteristic(READ_NOTIFY_CHARACTERISTIC_UUID)
      const writeChar = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID)

      notifyCharRef.current = notifyChar
      writeCharRef.current = writeChar

      notifyChar.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged)
      await notifyChar.startNotifications()

      setStatus("Connected and receiving data")
      setIsConnected(true)

      sendWriteRequest()
      startWriteInterval()
    } catch (error) {
      console.error("Bluetooth connection error:", error)
      setStatus(`Connection failed: ${error.message}`)
    }
  }, [handleCharacteristicValueChanged, sendWriteRequest, startWriteInterval])

  const disconnectBluetooth = useCallback(async () => {
    setStatus("Disconnecting...")
    stopWriteInterval()

    if (notifyCharRef.current) {
      try {
        await notifyCharRef.current.stopNotifications()
        notifyCharRef.current.removeEventListener("characteristicvaluechanged", handleCharacteristicValueChanged)
      } catch (error) {
        console.warn("Notification cleanup error:", error)
      }
    }

    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }

    setIsConnected(false)
    setLiveData(null)
    setDevice(null)
    setStatus("Disconnected")
  }, [device, handleCharacteristicValueChanged, stopWriteInterval])

  useEffect(() => {
    return () => {
      disconnectBluetooth()
    }
  }, [disconnectBluetooth])

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