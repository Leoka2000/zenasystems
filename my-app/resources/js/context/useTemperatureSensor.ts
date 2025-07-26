// hooks/useTemperatureSensor.ts
import { useBluetoothSensor } from "./useBluetoothSensor"

export const useTemperatureSensor = () => {
  const { temperature, timestamp, ...rest } = useBluetoothSensor()

  return {
    temperature,
    timestamp,
    ...rest,
  }
}
