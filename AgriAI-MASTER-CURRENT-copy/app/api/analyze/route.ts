import { NextResponse } from "next/server";
import { analyzePlantImage } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "No crop image was provided." }, { status: 400 });
    }
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "The uploaded file is not an image." }, { status: 400 });
    }
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Please upload an image smaller than 10 MB." }, { status: 400 });
    }

    const language = typeof formData.get("language") === "string" ? String(formData.get("language")) : "English";
    const crop = typeof formData.get("crop") === "string" ? String(formData.get("crop")) : undefined;
    const farmContextRaw = typeof formData.get("farmContext") === "string" ? String(formData.get("farmContext")) : "{}";
    let farmContext:any = {};
    try { farmContext = JSON.parse(farmContextRaw); } catch {}
    const analysis = await analyzePlantImage(image, { expectedCrop: crop, farmContext, language });
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Crop analysis error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to analyze the crop image."
    }, { status: 500 });
  }
}
