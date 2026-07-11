"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminSettings, updateAdminSettings } from "@/lib/api/settings";
import type { ShopSettings } from "@/lib/api/types";

const defaultSettings: ShopSettings = {
  storeName: "Tuong Vi Flower",
  phone: "+49 30 1234 5678\n+49 171 123 4567",
  address: "Hauptstrasse 14, 10115 Berlin",
  googleMapsUrl: "https://www.google.com/maps/place/Berlin",
  openingHours: "Monday - Saturday: 8:00 - 19:00\nSunday: 9:00 - 17:00",
  locale: "vi",
};

const locales = [
  { value: "de", label: "Deutsch", helper: "Use German map labels" },
  { value: "en", label: "English", helper: "Use English map labels" },
  { value: "vi", label: "Tieng Viet", helper: "Use Vietnamese map labels" },
];

function mapEmbedUrl(address: string, locale: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=${encodeURIComponent(locale)}&z=15&output=embed`;
}

export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const previewMapUrl = useMemo(
    () => mapEmbedUrl(settings.address, settings.locale),
    [settings.address, settings.locale],
  );

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const session = await getAdminSession();
      if (!mounted || !session?.token) return;

      setToken(session.token);
      try {
        const data = await getAdminSettings(session.token);
        if (mounted) setSettings(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Could not load shop settings.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key: keyof ShopSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!token) {
      setError("Your admin session is no longer valid.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await updateAdminSettings(token, settings);
      setSettings(saved);
      setMessage("Shop settings saved. Public pages will use the latest information.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save shop settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <AdminShell title="Shop Settings">
        <section className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-accent">Contact content</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
                Update shop information
              </h2>
              {loading ? <p className="mt-4 text-sm text-muted">Loading settings...</p> : null}

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Shop name
                  <input
                    value={settings.storeName}
                    onChange={(event) => updateField("storeName", event.target.value)}
                    className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Phone numbers
                  <textarea
                    value={settings.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Address
                  <textarea
                    value={settings.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Google Maps URL
                  <input
                    value={settings.googleMapsUrl}
                    onChange={(event) => updateField("googleMapsUrl", event.target.value)}
                    className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground lg:col-span-2">
                  Opening hours
                  <textarea
                    value={settings.openingHours}
                    onChange={(event) => updateField("openingHours", event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-silver-soft bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>

              <div className="mt-6 rounded-3xl border border-silver-soft bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Map language</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {locales.map((item) => {
                    const active = settings.locale === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => updateField("locale", item.value)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-silver-soft bg-surface text-muted hover:border-accent/50"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-1 block text-xs leading-5">{item.helper}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <p className="text-sm text-muted">
                  These fields update the public contact sections.
                </p>
              </div>
              {message ? <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-foreground">{message}</p> : null}
              {error ? <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            </div>

            <aside className="rounded-3xl border border-silver-soft bg-surface p-5 shadow-sm sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-accent">Live map</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">Location preview</h2>
              <div className="mt-5 overflow-hidden rounded-3xl border border-silver-soft bg-background">
                <iframe
                  title="Google Maps preview"
                  src={previewMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full border-0"
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">{settings.address}</p>
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-2xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent"
              >
                Open Google Maps
              </a>
            </aside>
          </div>
        </section>
      </AdminShell>
    </AdminGuard>
  );
}
