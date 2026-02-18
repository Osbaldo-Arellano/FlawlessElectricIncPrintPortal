"use client";

import { useState, useEffect, useCallback } from "react";
import { defaultBrand } from "@/types/brand";
import type { BrandState } from "@/types/brand";
import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";
import { ASSET_TYPES } from "@/types/assets";
import {
  DashboardHeader,
  AssetSelector,
  AssetTemplateGrid,
  AssetEditor,
  CompanyInfoCard,
  LogoUploader,
  BrandingCard,
  PhotoGallery,
} from "@/components/dashboard";

export default function DashboardPage() {
  const [brand, setBrand] = useState<BrandState>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [brandingUnlocked, setBrandingUnlocked] = useState(false);

  const [selectedAssetId, setSelectedAssetId] = useState(ASSET_TYPES[0].id);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAsset, setEditorAsset] = useState<AssetTypeConfig>(
    ASSET_TYPES[0],
  );
  const [editorTemplate, setEditorTemplate] = useState<AssetTemplate>(
    ASSET_TYPES[0].templates[0],
  );

  const selectedAsset =
    ASSET_TYPES.find((a) => a.id === selectedAssetId) ?? ASSET_TYPES[0];

  // Load brand from Supabase on mount
  useEffect(() => {
    fetch("/api/brand")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBrand((prev) => ({
            ...prev,
            name: data.name ?? prev.name,
            tagline: data.tagline ?? prev.tagline,
            email: data.email ?? prev.email,
            phone: data.phone ?? prev.phone,
            logo: data.logo_url ?? prev.logo,
            icon: data.icon_url ?? prev.icon,
            about_us: data.about_us ?? prev.about_us,
            address: data.address ?? prev.address,
            social_links: data.social_links ?? prev.social_links,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateBrand = useCallback((patch: Partial<BrandState>) => {
    setBrand((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const saveBrand = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brand.name,
          tagline: brand.tagline,
          email: brand.email,
          phone: brand.phone,
          logo_url: brand.logo,
          icon_url: brand.icon,
          about_us: brand.about_us,
          address: brand.address,
          social_links: brand.social_links,
        }),
      });
      if (res.ok) setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [brand]);

  // Immediately write logo_url / icon_url to the DB after upload or remove.
  // Can't reuse saveBrand() here because the setBrand state update is async —
  // saveBrand's closure would read the stale value before it settles.
  const persistLogo = useCallback(
    async (url: string | null) => {
      setBrand((prev) => ({ ...prev, logo: url }));
      await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brand.name,
          tagline: brand.tagline,
          email: brand.email,
          phone: brand.phone,
          logo_url: url,
          icon_url: brand.icon,
          about_us: brand.about_us,
          address: brand.address,
          social_links: brand.social_links,
        }),
      });
    },
    [brand],
  );

  const persistIcon = useCallback(
    async (url: string | null) => {
      setBrand((prev) => ({ ...prev, icon: url }));
      await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brand.name,
          tagline: brand.tagline,
          email: brand.email,
          phone: brand.phone,
          logo_url: brand.logo,
          icon_url: url,
          about_us: brand.about_us,
          address: brand.address,
          social_links: brand.social_links,
        }),
      });
    },
    [brand],
  );

  const openEditor = (asset: AssetTypeConfig, template: AssetTemplate) => {
    setEditorAsset(asset);
    setEditorTemplate(template);
    setEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <DashboardHeader companyName={brand.name} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Brand Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Manage your brand identity and assets
          </p>
        </div>

        <div className="space-y-10">
          {/* ── Print Assets Section ── */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Print Assets</h2>
            <div className="space-y-4">
              <AssetSelector
                selected={selectedAssetId}
                onChange={setSelectedAssetId}
              />
              <AssetTemplateGrid
                asset={selectedAsset}
                onSelect={(tpl) => openEditor(selectedAsset, tpl)}
              />
            </div>
          </section>

          {/* ── Branding Section — locked accordion ── */}
          <section>
            <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-zinc-900">
              {/* Accordion header */}
              <button
                type="button"
                onClick={() => setBrandingOpen((o) => !o)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Lock / unlock icon */}
                  {brandingUnlocked ? (
                    <svg
                      className="h-5 w-5 shrink-0 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 shrink-0 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4"
                      />
                    </svg>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">Branding</h2>
                    <p className="text-sm text-zinc-400">
                      Logo, About Us, address, social links, photo gallery
                    </p>
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${brandingOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Warning banner — always visible when closed or locked */}
              {(!brandingOpen || !brandingUnlocked) && (
                <div className="mx-6 mb-5 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  <p className="text-sm text-amber-300">
                    <span className="font-semibold">Live data.</span> Changes
                    here sync directly to your client&apos;s public website.
                    Unlock to edit.
                  </p>
                </div>
              )}

              {/* Expanded content */}
              {brandingOpen && (
                <div className="border-t border-zinc-800 px-6 pb-6 pt-6">
                  {/* Unlock toggle */}
                  {!brandingUnlocked ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                      <svg
                        className="h-10 w-10 text-amber-400/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-zinc-200">
                          Branding settings are locked
                        </p>
                        <p className="mt-1 max-w-sm text-sm text-zinc-500">
                          These settings control what appears on your
                          client&apos;s live website and/or print materials.
                          Edits take effect immediately after saving.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBrandingUnlocked(true)}
                        className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>
                        Unlock Branding Settings
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Re-lock button */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setBrandingUnlocked(false)}
                          className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4"
                            />
                          </svg>
                          Lock
                        </button>
                      </div>

                      {/* Company Info: name, tagline, email, phone */}
                      <CompanyInfoCard
                        brand={brand}
                        onUpdate={updateBrand}
                        dirty={dirty}
                        saving={saving}
                        onSave={saveBrand}
                      />

                      {/* Logo + Icon — side by side */}
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                        <div className="grid gap-8 sm:grid-cols-2">
                          <LogoUploader
                            logo={brand.logo}
                            onUpload={(url) => persistLogo(url)}
                            onRemove={() => persistLogo(null)}
                            label="Logo"
                            hint="Wide/horizontal lockup. PNG, SVG. Recommended 800×200px."
                          />
                          <LogoUploader
                            logo={brand.icon}
                            onUpload={(url) => persistIcon(url)}
                            onRemove={() => persistIcon(null)}
                            apiPath="/api/brand/icon"
                            label="Icon"
                            hint="Square brand mark used on cards & stickers. PNG, SVG. Recommended 512×512px."
                          />
                        </div>
                      </div>

                      {/* About Us, Address, Social Links */}
                      <BrandingCard
                        brand={brand}
                        onUpdate={updateBrand}
                        dirty={dirty}
                        saving={saving}
                        onSave={saveBrand}
                      />

                      {/* Photo Gallery */}
                      <PhotoGallery />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AssetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        asset={editorAsset}
        template={editorTemplate}
        brand={brand}
      />
    </div>
  );
}
