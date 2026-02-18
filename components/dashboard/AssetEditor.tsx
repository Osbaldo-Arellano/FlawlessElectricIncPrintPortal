"use client";

import { useState, useEffect, useMemo } from "react";
import type { BrandState } from "@/types/brand";
import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";
import { generateAssetHTML } from "@/lib/asset-html";

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.25;

/** Compute a zoom level that fits the native size into a reasonable preview area. */
function fitZoom(nativeW: number, nativeH: number): number {
  // Approximate available preview panel space (right panel minus padding)
  const availW = 700;
  const availH = 550;
  const fit = Math.min(availW / nativeW, availH / nativeH, 1);
  // Round down to nearest step for clean numbers
  return Math.max(ZOOM_MIN, Math.floor(fit / ZOOM_STEP) * ZOOM_STEP);
}

interface AssetEditorProps {
  open: boolean;
  onClose: () => void;
  asset: AssetTypeConfig;
  template: AssetTemplate;
  brand: BrandState;
}

export function AssetEditor({ open, onClose, asset, template, brand }: AssetEditorProps) {
  const dark = template.id.startsWith("dark");
  const [generating, setGenerating] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(1);
  const [orderSent, setOrderSent] = useState(false);
  const [quantity, setQuantity] = useState("100");

  // Seed fields from brand state when opening
  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string> = {};
    for (const f of asset.fields) {
      if (f.key === "email") seed[f.key] = brand.email;
      else if (f.key === "phone") seed[f.key] = formatPhone(brand.phone);
      else if (f.key === "tagline") seed[f.key] = brand.tagline;
      else if (f.key === "website") seed[f.key] = brand.website;
      else if (f.key === "companyName" || f.key === "fromName") seed[f.key] = brand.name;
      else seed[f.key] = "";
    }
    setFields(seed);
    setZoom(fitZoom(asset.previewWidth, asset.previewHeight));
  }, [open, asset, brand]);

  // Live preview HTML — for business cards, generate front & back separately for the preview
  const hasBack = asset.id === "business-card";

  const previewHTML = useMemo(
    () =>
      generateAssetHTML({
        asset,
        templateId: template.id,
        fields,
        logo: brand.logo,
        icon: brand.icon,
        tagline: brand.tagline,
        website: brand.website,
        dark,
        page: hasBack ? "front" : undefined,
      }),
    [asset, template.id, fields, brand.logo, brand.icon, brand.tagline, brand.website, dark, hasBack]
  );

  const backHTML = useMemo(
    () =>
      hasBack
        ? generateAssetHTML({
            asset,
            templateId: template.id,
            fields,
            logo: brand.logo,
            icon: brand.icon,
            tagline: brand.tagline,
            website: brand.website,
            dark,
            page: "back",
          })
        : "",
    [asset, template.id, fields, brand.logo, brand.icon, brand.tagline, brand.website, dark, hasBack]
  );

  // Full HTML with both pages for PDF order
  const orderHTML = useMemo(
    () =>
      generateAssetHTML({
        asset,
        templateId: template.id,
        fields,
        logo: brand.logo,
        icon: brand.icon,
        tagline: brand.tagline,
        website: brand.website,
        dark,
      }),
    [asset, template.id, fields, brand.logo, brand.icon, brand.tagline, brand.website, dark]
  );

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (!open) return null;

  const formatCurrency = (raw: string): string => {
    const stripped = raw.replace(/[^0-9.]/g, "");
    const parts = stripped.split(".");
    const whole = parts[0] || "0";
    const dec = parts.length > 1 ? "." + parts[1].slice(0, 2) : "";
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$${withCommas}${dec}`;
  };

  const updateField = (key: string, value: string, type?: string) => {
    let formatted = value;
    if (type === "tel") formatted = formatPhone(value);
    else if (type === "currency") formatted = formatCurrency(value);
    setFields((prev) => ({ ...prev, [key]: formatted }));
  };

  const requiredMissing = asset.fields
    .filter((f) => f.required)
    .some((f) => !fields[f.key]?.trim());

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));

  const handleOrder = async () => {
    setGenerating(true);
    setOrderSent(false);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: orderHTML,
          filename: `${asset.id}-${template.id}`,
          quantity,
        }),
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Order failed"));

      setOrderSent(true);
      setTimeout(() => setOrderSent(false), 2000);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Display size = native 96dpi size * zoom
  const displayW = asset.previewWidth * zoom;
  const displayH = asset.previewHeight * zoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/80 p-3 md:p-[50px]" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header bar ── */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-6 py-3">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{template.name}</h2>
            <span className="hidden md:inline rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {asset.label} &middot; {asset.description}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-zinc-400">Qty</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="1000">1,000</option>
              </select>
            </div>
            <button
              onClick={handleOrder}
              disabled={generating || requiredMissing || orderSent}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {generating ? "Sending..." : orderSent ? "Order Sent!" : "Confirm Order"}
            </button>
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* ── Body: fields left, preview right ── */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left panel — Variable Fields */}
          <div className="w-full md:w-[340px] shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-800 p-5 max-h-[40vh] md:max-h-none">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Variable Fields
            </p>
            <div className="space-y-3">
              {asset.fields.map((f) =>
                f.readonly ? (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-400">{f.label}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fields[f.key] ?? ""}
                        readOnly
                        tabIndex={-1}
                        placeholder={f.placeholder}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 pr-8 text-sm text-zinc-400 placeholder-zinc-600 cursor-not-allowed select-none"
                      />
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4" />
                      </svg>
                    </div>
                    {f.hint && (
                      <p className="text-xs text-zinc-500">{f.hint}</p>
                    )}
                  </div>
                ) : f.type === "textarea" ? (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-400">{f.label}{f.required && <span className="text-red-400"> *</span>}</label>
                    <textarea
                      value={fields[f.key] ?? ""}
                      onChange={(e) => updateField(f.key, e.target.value, f.type)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-400">{f.label}{f.required && <span className="text-red-400"> *</span>}</label>
                    <input
                      type={f.type === "tel" || f.type === "currency" ? "text" : (f.type ?? "text")}
                      value={fields[f.key] ?? ""}
                      onChange={(e) => updateField(f.key, e.target.value, f.type)}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right panel — Live Preview */}
          <div className="relative flex min-w-0 min-h-0 flex-1 flex-col bg-zinc-700">
            {/* Zoom toolbar */}
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-1 py-0.5 shadow-lg">
              <button
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className="w-12 text-center text-xs text-zinc-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            {/* Scrollable preview area */}
            <div className="flex-1 overflow-auto">
              <div
                className="flex flex-col items-center justify-center gap-6 p-4 md:p-10"
                style={{
                  minWidth: displayW + 80,
                  minHeight: hasBack ? displayH * 2 + 120 : displayH + 80,
                }}
              >
                {/* Front (or only) page */}
                {hasBack && (
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Front</span>
                )}
                <div
                  className="shrink-0 rounded-lg border border-zinc-700 shadow-2xl overflow-hidden"
                  style={{ width: displayW, height: displayH }}
                >
                  <iframe
                    srcDoc={previewHTML}
                    title="Preview Front"
                    className="pointer-events-none block border-0"
                    scrolling="no"
                    style={{
                      width: asset.previewWidth,
                      height: asset.previewHeight,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>

                {/* Back page (business cards only) */}
                {hasBack && (
                  <>
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Back</span>
                    <div
                      className="shrink-0 rounded-lg border border-zinc-700 shadow-2xl overflow-hidden"
                      style={{ width: displayW, height: displayH }}
                    >
                      <iframe
                        srcDoc={backHTML}
                        title="Preview Back"
                        className="pointer-events-none block border-0"
                        scrolling="no"
                        style={{
                          width: asset.previewWidth,
                          height: asset.previewHeight,
                          transform: `scale(${zoom})`,
                          transformOrigin: "top left",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="shrink-0 border-t border-zinc-800 px-4 py-2 text-center text-xs text-zinc-500">
              {asset.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
