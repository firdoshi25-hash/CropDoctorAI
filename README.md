# CropDoctor AI

CropDoctor is a React/Vite app with an Express API. Farmers enter a name only—there is no password or authentication. Scan history and assistant conversations are stored on the server in separate local JSON files per normalized name, with uploaded photos stored alongside them.

## Run locally

Requirements: Node.js 22 or newer.

1. Copy `server/.env.example` to `server/.env` and set `GEMINI_API_KEY` to a Google Gemini API key. The key stays on the server and is never sent to the browser. The scan and assistant features return a clear configuration error until this is set.
2. In one terminal, run:

   ```sh
   cd server
   npm install
   npm start
   ```

3. In another terminal, run:

   ```sh
   cd client
   npm install
   npm run dev
   ```

Open the Vite URL (usually `http://localhost:5173`). The Vite development server proxies `/api` requests to the API on port 3001. Set `PORT` in `server/.env` to use a different API port and update the proxy in `client/vite.config.js` to match.

## Languages

Use the language selector on the name-entry, landing, or dashboard screen to translate the website into any of the 22 scheduled Indian languages. English is also available. Website labels are translated by Gemini using the server-side API key, so translation requests use that key's quota; the selected language is saved in this browser. Plant scans and assistant replies are separately requested in the selected language.

## Plant library

The dashboard library includes more than 30 common crops and plants. Select one to request a growing guide, or search for another plant by name; guide searches use Gemini, its API quota, and the selected response language. Guides show that plant's growth stages as a step-by-step process. Scan results also include specific stage details; older scan records load their lifecycle steps from the plant guide when available. Selecting **Scan this plant** or using the care guide's scan action starts a target-specific scan that only saves a result when the photo is confirmed as that plant. The regular **Scan Plant** action continues to identify any plant in the photo.

## Data and privacy

Data is written to `server/data/` by default. Set `DATA_DIR` in `server/.env` to move it. Each scan photo and conversation belongs to the entered name. This is **not authentication or a privacy boundary**: anyone who enters the same name can read and add to that name's data. Do not use this name-only setup for sensitive or private information. Back up `server/data/` to preserve records; deleting it removes saved records and photos.

Plant identification and care suggestions are AI-generated, may be inaccurate, and are not a substitute for local agricultural advice. Scan images and assistant questions are sent to Google's Gemini API when the AI features are used.

## Checks

```sh
cd server
npm test
```

```sh
cd client
npm run lint
npm run build
```
