# AgriAI accessibility layer

## Languages
The dashboard has a persistent language selector for English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi and Bengali. The choice is saved locally.

## Voice agent
- Spoken questions can be captured with the browser Speech Recognition API.
- Assistant answers are automatically read aloud when the browser supports Speech Synthesis.
- Any assistant answer can be replayed.
- The daily farm plan has a Read Aloud action.
- The selected Indian language is used for speech input/output.
- Chrome/Chromium on Android and desktop is the recommended demo browser because Speech Recognition support varies by browser.

## AI language
The selected language is sent to the agricultural assistant and multimodal crop analyzer. The model is instructed to answer in the selected language while preserving scientific names, measurements and safety-critical identifiers.

## No extra token cost for voice
Browser speech input/output does not require another paid AI API. The OpenAI API is used for agricultural reasoning and visual analysis; voice accessibility itself uses the device/browser capabilities.
