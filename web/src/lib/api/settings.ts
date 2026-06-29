import { apiFetch } from "./client";
import type { ShopSettings } from "./types";

export function getSettings(signal?: AbortSignal) {
  return apiFetch<ShopSettings>("/settings", { signal });
}

export function getAdminSettings(token: string) {
  return apiFetch<ShopSettings>("/admin/settings", { token });
}

export function updateAdminSettings(token: string, input: ShopSettings) {
  return apiFetch<ShopSettings>("/admin/settings", {
    method: "PATCH",
    body: input,
    token,
  });
}
