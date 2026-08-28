import { RawImage, pipeline } from "@huggingface/transformers";
import OpenAI from "openai";

const LOCAL_MODEL_ID =
  "onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX";
const VISION_MODEL =
  process.env.OPENAI_VISION_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";

type Prediction = { label: string; score: number };
type Previous = { file: Buffer; mime: string; capturedAt: string; analysis?: any };

let classifierPromise: Promise<any> | null = null;

async function getClassifier() {
  if (!classifierPromise) classifierPromise = pipeline("image-classification", LOCAL_MODEL_ID) as Promise<any>;
  return classifierPromise;
}

function prettyLabel(label: string) {
  return label.replaceAll("___", " — ").replaceAll("_", " ").replace(/[()]/g, "").replace(/\s+/g, " ").trim();
}
function cropFrom(label: string) { return prettyLabel(label.split("___")[0]) || "Unknown crop"; }
function normalizeCrop(value: string) {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    tomato:"Tomato", grape:"Grape", potato:"Potato", apple:"Apple", corn:"Corn", maize:"Corn",
    peach:"Peach", pepper:"Pepper", "bell pepper":"Pepper", blueberry:"Blueberry", cherry:"Cherry",
    orange:"Orange", raspberry:"Raspberry", soybean:"Soybean", squash:"Squash", strawberry:"Strawberry"
  };
  return aliases[key] || value.trim();
}
function isHealthy(label: string) { return label.toLowerCase().endsWith("___healthy"); }
function confidenceBand(score: number) { return score >= .85 ? "High" : score >= .65 ? "Moderate" : "Low"; }
function dataUrl(bytes: Buffer, mime: string) { return `data:${mime};base64,${bytes.toString("base64")}`; }
function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Vision model returned invalid structured output.");
  }
}

async function localScreen(file: File, expectedCrop?: string) {
  try {
    const raw = await RawImage.fromBlob(new Blob([await file.arrayBuffer()], { type: file.type || "image/jpeg" }));
    const classifier = await getClassifier();
    const predictions = (await classifier(raw, { topk: 38 })) as Prediction[];
    if (!predictions?.length) return null;

    const cropTotals = new Map<string, number>();
    for (const prediction of predictions) {
      const crop = cropFrom(prediction.label);
      cropTotals.set(crop, (cropTotals.get(crop) || 0) + prediction.score);
    }
    const detectedCrop = [...cropTotals.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || "Unknown";
    const expected = expectedCrop ? normalizeCrop(expectedCrop) : undefined;
    const expectedScore = expected ? cropTotals.get(expected) || 0 : cropTotals.get(detectedCrop) || 0;
    const cropPredictions = predictions.filter(p => cropFrom(p.label) === (expected || detectedCrop)).sort((a,b)=>b.score-a.score);
    const cropTop = cropPredictions[0];
    const conditionalScore = cropTop && expectedScore > 0 ? cropTop.score / expectedScore : 0;
    return {
      model: LOCAL_MODEL_ID,
      topLabel: prettyLabel(predictions[0].label),
      crop: expected || detectedCrop,
      detectedCrop,
      expectedCrop: expected || null,
      cropMatches: !expected || detectedCrop === expected || expectedScore >= .45,
      cropConfidence: Math.round(expectedScore * 100),
      score: cropTop?.score ?? predictions[0].score,
      conditionalScore,
      usable: Boolean(cropTop) && conditionalScore >= .65 && (cropTop?.score ?? 0) >= .20,
      healthy: Boolean(cropTop && isHealthy(cropTop.label)),
      topPredictions: predictions.slice(0,10).map(p=>({label:prettyLabel(p.label),crop:cropFrom(p.label),score:Math.round(p.score*100)}))
    };
  } catch (error) {
    console.warn("Local plant classifier unavailable:", error);
    return null;
  }
}

async function multimodalScreen(file: File, previous: Previous | undefined, farmContext: any, local: any, expectedCrop?: string, language?: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const current = Buffer.from(await file.arrayBuffer());
  const expected = expectedCrop ? normalizeCrop(expectedCrop) : null;
  const previousText = previous
    ? `A previous observation from ${previous.capturedAt} is attached as the SECOND image. Compare only visible changes if they plausibly show the same plant/area.`
    : "No previous image is available.";

  const prompt = `You are AgriAI's evidence-first visual agronomy layer.

SELECTED CROP: ${expected || "Not specified"}

OUTPUT LANGUAGE: ${language || "English"}
- Return all human-readable explanation fields in this language. Keep crop names, scientific names, measurements and safety-critical product identifiers accurate.

CROP SAFETY GATE:
- If a selected crop is provided, verify whether the image plausibly shows that crop.
- If it clearly does not, return status "crop_mismatch" and DO NOT diagnose the other crop.
- Do not let a secondary classifier override visual evidence. The local PlantVillage-style classifier is known to be unreliable on field photographs.
- If crop identity is uncertain, abstain and request a clearer image.

DIAGNOSTIC STANDARD:
- Visible findings are observations, not diagnoses.
- Consider disease, insects, nutrient disorders, water stress, salinity, heat/cold, herbicide injury, mechanical damage and normal variation.
- Never invent chemical products, doses, rates, withdrawal periods, registrations or legal requirements.
- Never turn model confidence into disease severity or crop-health percentages.
- If evidence is weak, say so.

FARM CONTEXT:
${JSON.stringify(farmContext ?? {}, null, 2).slice(0,18000)}

SECONDARY LOCAL SCREEN:
${JSON.stringify(local ?? {}, null, 2)}

${previousText}

Return ONLY JSON:
{
 "crop": string,
 "status": "actionable_screening"|"needs_more_evidence"|"crop_mismatch"|"image_quality",
 "imageQuality": "good"|"usable"|"poor",
 "visibleFindings": string[],
 "primaryProblem": string,
 "problemType": "disease"|"pest"|"nutrition"|"water_stress"|"environment"|"mechanical"|"healthy_or_normal"|"uncertain"|"mixed",
 "confidence": number,
 "confidenceReason": string,
 "differential": [{"candidate": string, "likelihood": "higher"|"possible"|"lower", "why": string}],
 "visibleAffectedArea": "not_visible"|"<5%"|"5-20%"|"21-50%"|">50%"|"uncertain",
 "evidenceNeeded": string[],
 "immediateActions": string[],
 "nextSteps": string[],
 "treatmentGuidance": string,
 "recheckWindow": string,
 "doNotDo": string[],
 "disclaimer": string
}
Confidence is diagnostic confidence from image + context, not classifier confidence.`;

  const content: any[] = [
    { type: "input_text", text: prompt },
    { type: "input_image", image_url: dataUrl(current, file.type || "image/jpeg"), detail: "high" }
  ];
  if (previous) content.push({ type: "input_image", image_url: dataUrl(previous.file, previous.mime), detail: "high" });

  const response = await client.responses.create({
    model: VISION_MODEL,
    input: [{ role: "user", content }]
  });
  return parseJson(response.output_text);
}

export async function analyzePlantImage(file: File, options?: { expectedCrop?: string; farmContext?: any; previous?: Previous; language?: string }) {
  const expected = options?.expectedCrop ? normalizeCrop(options.expectedCrop) : undefined;
  // The local classifier is deliberately secondary. It must not block a stronger
  // multimodal answer, because PlantVillage-style models can misclassify real field photos.
  const local = await localScreen(file, expected);

  let visual: any = null;
  try {
    visual = await multimodalScreen(file, options?.previous, options?.farmContext, local, expected, options?.language);
  } catch (error) {
    console.warn("Multimodal plant analysis unavailable:", error);
  }

  if (visual) {
    const returnedCrop = normalizeCrop(String(visual.crop || ""));
    if (expected && visual.status === "crop_mismatch") {
      return {
        ...visual, crop: expected, status:"crop_mismatch", primaryProblem:"Crop mismatch — analysis blocked",
        problemType:"uncertain", confidence:0, cropVerified:false,
        treatmentGuidance:"No disease-specific treatment should be selected because the image does not reliably match the selected crop.",
        recommendation:"Capture a clearer image of the selected crop before diagnosis.",
        disclaimer:"AgriAI blocked this result because visual crop verification did not support the selected crop.",
        localClassifier: local, model: VISION_MODEL
      };
    }
    if (expected && returnedCrop && returnedCrop.toLowerCase() !== expected.toLowerCase()) {
      return {
        ...visual, crop: expected, status:"crop_mismatch", primaryProblem:"Crop identity is inconsistent — analysis blocked",
        problemType:"uncertain", confidence:0, cropVerified:false,
        treatmentGuidance:"No disease-specific treatment should be selected until crop identity is clear.",
        recommendation:"Retake the image with one plant filling most of the frame.",
        disclaimer:"AgriAI refused to substitute another crop's diagnosis.",
        localClassifier: local, model: VISION_MODEL
      };
    }
    const confidence = Math.max(0, Math.min(100, Number(visual.confidence) || 0));
    return {
      ...visual,
      crop: expected || returnedCrop || "Unknown",
      source:"multimodal-agronomic-vision",
      model:VISION_MODEL,
      localClassifier:local,
      cropVerified:Boolean(expected ? returnedCrop.toLowerCase() === expected.toLowerCase() : returnedCrop),
      status:visual.status || (confidence >= 80 && visual.imageQuality !== "poor" ? "actionable_screening":"needs_more_evidence"),
      recommendation:visual.treatmentGuidance || "No treatment recommendation is justified until evidence is stronger.",
      confidenceBand:confidenceBand(confidence/100),
      disclaimer:visual.disclaimer || "AI-assisted visual screening; not a laboratory-confirmed diagnosis. Confirm high-impact treatment decisions locally."
    };
  }

  if (!local) throw new Error("No vision analysis engine is available. Add OPENAI_API_KEY for the evidence-first multimodal analyzer.");

  const confidence = Math.round(Math.max(0, Math.min(1, local.conditionalScore))*100);
  return {
    crop: local.crop, cropVerified:Boolean(local.cropMatches), imageQuality:"unknown",
    visibleFindings:[], primaryProblem:local.healthy && local.usable ? "No disease class detected by the local screen" : "Insufficient evidence for a reliable diagnosis",
    problemType:local.healthy ? "healthy_or_normal" : "uncertain", confidence,
    confidenceReason:"Local classifier output is only a screening signal; it is not a diagnostic probability.",
    differential:[], visibleAffectedArea:"uncertain",
    evidenceNeeded:["A clear close-up of the affected tissue","A whole-plant photo","Crop variety and growth stage","When symptoms first appeared and how quickly they are spreading"],
    immediateActions:["Do not apply a chemical treatment solely from this screen.","Inspect several plants and record whether the same pattern is present."],
    nextSteps:["Capture a well-lit close-up and a whole-plant image."],
    treatmentGuidance:"Do not select a disease-specific treatment until the evidence is stronger.",
    recheckWindow:"Recheck after obtaining better evidence or sooner if symptoms are rapidly spreading.",
    doNotDo:["Do not convert classifier confidence into disease severity or crop-health percentage."],
    source:"local-plant-classifier", model:LOCAL_MODEL_ID, localClassifier:local,
    status:"needs_more_evidence", recommendation:"The local classifier is only a screening signal; stronger field evidence is needed before treatment.",
    confidenceBand:confidenceBand(local.conditionalScore),
    disclaimer:"Local plant classification can fail on real field photographs. This is not a confirmed diagnosis."
  };
}
