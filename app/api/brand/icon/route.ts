import { NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { supabase } from "@/lib/supabase";

const auth0 = new Auth0Client();

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.sub.replace(/\|/g, "_");
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/icon.${ext}`;

  const { error } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: publicUrlData } = supabase.storage.from("logos").getPublicUrl(path);
  const bustCache = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ url: bustCache });
}

export async function DELETE() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.sub.replace(/\|/g, "_");
  const { data: files } = await supabase.storage.from("logos").list(userId);

  if (files && files.length > 0) {
    const iconFiles = files.filter((f) => f.name.startsWith("icon."));
    if (iconFiles.length > 0) {
      await supabase.storage
        .from("logos")
        .remove(iconFiles.map((f) => `${userId}/${f.name}`));
    }
  }

  return NextResponse.json({ ok: true });
}
