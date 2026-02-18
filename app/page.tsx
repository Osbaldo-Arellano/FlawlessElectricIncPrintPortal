"use client";

import { useState } from "react";
import { defaultBrand } from "@/types/brand";
import type { AssetTypeConfig, AssetTemplate } from "@/types/assets";
import { ASSET_TYPES } from "@/types/assets";
import {
  DashboardHeader,
  AssetSelector,
  AssetTemplateGrid,
  AssetEditor,
} from "@/components/dashboard";

export default function DashboardPage() {
  const brand = defaultBrand;
  const [selectedAssetId, setSelectedAssetId] = useState(ASSET_TYPES[0].id);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAsset, setEditorAsset] = useState<AssetTypeConfig>(ASSET_TYPES[0]);
  const [editorTemplate, setEditorTemplate] = useState<AssetTemplate>(ASSET_TYPES[0].templates[0]);

  const selectedAsset = ASSET_TYPES.find((a) => a.id === selectedAssetId) ?? ASSET_TYPES[0];

  const openEditor = (asset: AssetTypeConfig, template: AssetTemplate) => {
    setEditorAsset(asset);
    setEditorTemplate(template);
    setEditorOpen(true);
  };

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

        <div className="space-y-6">
          <AssetSelector
            selected={selectedAssetId}
            onChange={setSelectedAssetId}
          />
          <AssetTemplateGrid
            asset={selectedAsset}
            onSelect={(tpl) => openEditor(selectedAsset, tpl)}
          />
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
