import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function parseHexData(hexString) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString
  const timestamp = parseInt(cleanHex.slice(0, 8), 16)
  const x = parseInt(cleanHex.slice(12, 16), 16) << 16 >> 16
  const y = parseInt(cleanHex.slice(16, 20), 16) << 16 >> 16
  const z = parseInt(cleanHex.slice(20, 24), 16) << 16 >> 16
  return { timestamp, x, y, z }
}