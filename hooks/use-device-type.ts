"use client";

import { useState, useEffect } from "react";

export interface DeviceType {
  isMobile: boolean;
  isTouch: boolean;
  isIOS: boolean;
  isLoading: boolean;
}

/**
 * Hook to detect device type based on:
 * - Screen size using Tailwind's md breakpoint (768px)
 * - Touch capability detection
 * - iOS device detection
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTouch: false,
    isIOS: false,
    isLoading: true,
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

      // Check for iOS (iPhone, iPad, iPod)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      setDeviceType({ isMobile, isTouch, isIOS, isLoading: false });
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy support
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      setDeviceType({ isMobile, isTouch, isIOS, isLoading: false });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}
