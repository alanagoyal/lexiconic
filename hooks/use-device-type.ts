"use client";

import { useState, useEffect } from "react";

export interface DeviceType {
  isMobile: boolean;
  isTouch: boolean;
}

/**
 * Hook to detect device type based on:
 * - Screen size using Tailwind's md breakpoint (768px)
 * - Touch capability detection
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTouch: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      // Use Tailwind's md breakpoint (768px)
      const isMobile = window.innerWidth < 768;

      // Check for touch capability
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy support
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

      setDeviceType({ isMobile, isTouch });
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
}
