// SimpleWrapper.tsx
"use client";

import * as React from "react";
import { ChartLineInteractive } from "./temperature-chart"; // Adjust path if needed

export function SimpleWrapper() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <ChartLineInteractive />
    </div>
  );
}
export default SimpleWrapper;
