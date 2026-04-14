# Send to TheBrain

A small Chrome / Firefox / Safari-compatible browser extension that saves the
active page as a thought in [TheBrain](https://www.thebrain.com) via the
desktop app's local HTTP API.

It's intentionally minimal and self-contained so it can double as a reference
implementation for the local API: React + TypeScript + Vite + Tailwind, no
build-time magic beyond `@crxjs/vite-plugin`.

## Features

- Shows the active thought's name right in the popup, with an inline
  **Create child / Attach** toggle so you can decide per-send which mode to
  use — the choice is remembered.
- Splits titles like `"Apple Inc | Wikipedia"` into name + label using the
  same separator rules the desktop clients use.
- Attaches the URL to the thought with the page title as the attachment
  name.
- De-dupes via the local API's `by-location` endpoint: if the URL is already
  attached anywhere in the current brain, the extension activates that
  thought instead of creating a duplicate.
- Optional per-send checkbox (only shown when applicable) to strip query
  parameters and fragments before saving.
- Connectivity, API key, and "a brain is open" are all verified the moment
  the popup opens, so errors surface immediately rather than after a click.
- Clear messages for the common "why did nothing happen?" cases:
  - TheBrain isn't running
  - API key invalid / belongs to a different user
  - No brain open
  - Brain is read-only
- Auto-dismisses 3 seconds after a successful save, with a shrinking
  progress bar so you can see it coming (and still click "Open in
  TheBrain" if you want to jump straight to the new thought).
- Options page for updating the endpoint / API key and setting defaults
  for the send mode and post-save activation.

## Connecting to the desktop app

1. Start the TheBrain desktop app.
2. Go to **Settings → User → Local API**.
3. Copy the **API Endpoint** (e.g. `http://localhost:52341/api/`) and your
   **API Key** — both have copy buttons.
4. In the extension popup's Setup screen (or the options page), paste both and
   press **Test connection**. If it works, you'll see your brain count.

The API key belongs to a single user — whichever user generated it.

## Build

```bash
npm install
npm run icons    # rasterize public/logo.svg into the manifest PNG sizes
npm run build    # outputs to dist/
```

Load the unpacked extension:

1. Visit `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked** and choose the `dist/` folder.

For local development:

```bash
npm run dev
```

## Tests

```bash
npm test
```

Runs the Vitest suite, which covers:

- `titleSplit.test.ts` — page-title → `{ name, label }` splitter behaviour
  across all the supported separators (pipe, dash, em-dash, reverse colon,
  non-breaking space, etc.).
- `endpoint.test.ts` — normalization of the pasted API endpoint
  (with/without scheme, trailing slash, `/api` suffix) into the base URL
  the client actually calls.
- `urlTrim.test.ts` — detection and stripping of query parameters and
  fragments used by the per-send "Remove query parameters" checkbox.

## Project layout

```
src/
├── popup/           Popup UI — Setup flow + Send flow
├── options/         Options page — API key + behaviour
├── components/      Shared UI primitives (shadcn-flavoured)
├── api/             TheBrainLocalClient + typed errors + DTOs
├── lib/             titleSplit, sendToBrain, settings, endpoint,
│                    urlTrim, browser shim
├── styles/          Tailwind entrypoint + OKLCH tokens
└── background/      Placeholder MV3 service worker
```

## Porting to Firefox / Safari

- **Firefox:** `manifest.json` is already MV3-compatible. Run `npx web-ext run
  -s dist/` after building.
- **Safari:** Use Apple's converter:
  ```
  xcrun safari-web-extension-converter dist/
  ```
  Safari's converter wraps the extension in an Xcode project; no code changes
  should be needed because `src/lib/browser.ts` abstracts over `chrome.*` vs
  `browser.*`.

## Endpoints used

| Purpose                  | Method | Path                                                             |
| ------------------------ | ------ | ---------------------------------------------------------------- |
| Read app state           | GET    | `/api/app/state`                                                 |
| List brains (test key)   | GET    | `/api/brains`                                                    |
| Fetch a thought (name)   | GET    | `/api/thoughts/{brainId}/{thoughtId}`                            |
| Find URL duplicates      | GET    | `/api/attachments/{brainId}/by-location?location=…&type=3`       |
| Create child thought     | POST   | `/api/thoughts/{brainId}`                                        |
| Attach URL               | POST   | `/api/attachments/{brainId}/{thoughtId}/url?url=…&name=…`        |
| Activate a thought       | POST   | `/api/app/brain/{brainId}/thought/{thoughtId}/activate`          |

All requests send `Authorization: Bearer <your-api-key>`.

## License

MIT — see [LICENSE](./LICENSE).
