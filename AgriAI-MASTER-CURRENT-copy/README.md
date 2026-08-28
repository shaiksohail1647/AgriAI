# AgriAI — Farmer-first SIH build

This build now follows the intended farmer journey:

```text
Login
  ↓
What would you like to do?
  ├─ Option 1: Start Daily Farming
  │    ↓
  │  Location → live weather → space measurement
  │    ↓
  │  calculated crop suitability → user selects crop
  │    ↓
  │  foundation phase: bed/soil/irrigation/spacing preparation
  │    ↓
  │  farmer confirms actual planting → biological Day 1 starts
  │    ↓
  │  daily directions + reminders + photos/history
  │
  └─ Option 2: Ask About My Crop
       ↓
     select crop → ask question / upload photo
       ↓
     evidence-first agricultural assistant
```

## What was fixed

- Farmer-first home choice instead of dumping the user into technical controls.
- Crop recommendations are calculated **after** live location/weather and space measurements.
- The farmer selects the crop; only then does the daily farm journal begin.
- Farm start date is stored and daily Day numbers use the actual calendar date.
- Multiple photos captured on the same date remain under the same day.
- Option 2 opens the specialist assistant immediately.
- Crop photo analysis is **OpenAI multimodal first** when the API key is configured.
- The local PlantVillage-style classifier is secondary evidence and no longer gets to veto a stronger multimodal crop identification merely because it misclassified a field photograph.
- If the visual model says the selected crop is not supported, AgriAI abstains instead of substituting another crop's disease.
- The assistant combines farm context, daily history, agricultural knowledge and live web research when the API key is available.
- The interface is now farmer-friendly and avoids exposing engineering/AI terminology as the primary workflow.

## Run from the project root

The folder opened in VS Code must directly contain `package.json`.

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

Or double-click `START-AGRIAI.bat`.

## Demo login

Email:
`demo@agriai.local`

Password:
`AgriAI@2026!`

## OpenAI setup

Create `.env.local`:

```powershell
Copy-Item .env.local.example .env.local
```

Then:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.6-luna
OPENAI_VISION_MODEL=gpt-5.6-luna
```

Do not put the API key in frontend code.

GPT-5.6 Luna is a current OpenAI API model intended for cost-sensitive, high-volume workloads and supports text and image input. The application still does **not** claim that any image diagnosis is 99% guaranteed: the correct design is to give a strong answer when evidence supports it and explicitly abstain when evidence is insufficient.

## Daily images

Images are stored locally under:

```text
public/uploads/<user>/
```

Metadata is stored under:

```text
data/daily-scans/<user>.json
```

The saved record contains the real capture timestamp, timezone, calendar date, farm start date, crop, notes, location and analysis.

## Important accuracy behavior

The system intentionally avoids this unsafe pattern:

```text
photo → random classifier label → treatment
```

Instead:

```text
photo
→ crop verification
→ image quality
→ visible findings
→ differential possibilities
→ crop + weather + farm context
→ evidence check
→ proportionate next action
→ abstain if evidence is weak
```

For high-impact pesticide/fungicide/herbicide, food-safety or severe-disease decisions, the assistant should use current local label/extension information and recommend appropriate professional confirmation.

## Storage note

This is a local/internal SIH prototype. For public deployment, replace local JSON/file storage with an authenticated database and object storage.


## Important farm lifecycle rule

Choosing a crop is **not** the same as planting it. The application now has an explicit foundation phase after crop selection:

1. Confirm location/weather and measured space.
2. Calculate suitable crops.
3. Farmer selects a crop.
4. AgriAI shows the foundation plan: mark spacing, prepare soil, arrange irrigation and prepare planting points.
5. The farmer confirms that the seed/seedling has actually been planted.
6. That confirmation date becomes **biological Day 1**.
7. Subsequent Day numbers are calculated from the real planting calendar date, not from photo upload count.
8. Photos taken on the same date stay together under that day's journal entry.

This prevents the UI from falsely implying that plants existed on the day the farmer only measured the field.


## Farmer language + voice accessibility

The interface now includes a persistent language selector for:
- English
- Hindi
- Telugu
- Tamil
- Kannada
- Malayalam
- Marathi
- Bengali

The selected language is saved in the browser so the farmer does not need to choose it again.

Voice accessibility is browser-native:
- **Speak** uses the device microphone through Speech Recognition when supported, so a farmer can ask AgriAI without typing.
- **Read aloud** uses the device's speech synthesis and the selected Indian-language voice where the browser/OS provides it.
- Daily farm actions can be read aloud.
- Assistant answers can be replayed with one tap.

This does not require another paid API. It uses the farmer's device/browser speech capabilities. Chrome on Android/desktop generally gives the best compatibility; unsupported browsers show a clear fallback message.

Assistant and image-analysis requests also receive the selected language so the agricultural explanation can be returned in that language when the OpenAI API is enabled. The app keeps crop names, measurements and safety-critical identifiers accurate rather than blindly translating technical identifiers.
