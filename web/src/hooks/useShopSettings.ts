"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/api/settings";
import type { ShopSettings } from "@/lib/api/types";

export function useShopSettings(fallback: ShopSettings) {
  const [settings, setSettings] = useState<ShopSettings>(fallback);

  useEffect(() => {
    const controller = new AbortController();

    getSettings(controller.signal)
      .then(setSettings)
      .catch(() => {
        // Keep local translated fallback when the backend is unavailable.
      });

    return () => controller.abort();
  }, []);

  return settings;
}
