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
  same separator rules the desktop clients use, and strips leading
  unread-count prefixes like `"(19) "` that sites like Gmail, YouTube, and
  Substack inject into the document title.
- Attaches the URL to the thought with the page title as the attachment
  name.
- De-dupes via the local API's `by-location` endpoint: if the URL is already
  attached anywhere in the current brain, the extension activates that
  thought instead of creating a duplicate.
- Optional per-send checkbox (only shown when applicable) to strip query
  parameters and fragments before saving. A configurable **domain
  exception list** (defaults: `youtube.com`, `youtu.be`) keeps the query
  string intact on sites where it carries page identity.
- Optional **"Automatically proceed after 3 seconds"** setting: the popup
  arms a countdown and sends without a click. Any interaction (click or
  key press) cancels the countdown.
- Close (×) button in the popup header to dismiss at any time.
- Connectivity, API key, and "a brain is open" are all verified the moment
  the popup opens, so errors surface immediately rather than after a click.
- Clear messages for the common "why did nothing happen?" cases:
  - TheBrain isn't running
  - API key invalid / belongs to a different user
  - No brain open
  - Brain is read-only
- Auto-dismisses 3 seconds after a successful save, with a shrinking
  progress bar so you can see it coming (and still click "Open in
  TheBrain" if you want to jump straight to the new thought). Clicking
  or pressing a key inside the popup cancels the auto-dismiss.
- Options page for updating the endpoint / API key and setting defaults
  for the send mode, post-save activation, auto-proceed, and the list of
  domains exempt from query-param trimming.

## Getting started

This version of the extension is published as source code so developers and
tinkerers can experiment with it and adapt it to their own workflows — change
the UI, tweak how titles are split, add a new send mode, whatever you like.
To use it you'll build it yourself and load it into your browser. If you're
not a developer, don't worry — the steps below walk through it end-to-end.
You'll install one free tool (Node.js), download the code, and run three
short commands.

### 1. Install Node.js

The extension is built using **Node.js**, a free tool that includes a
command-line program called `npm`. `npm` downloads the small libraries this
project depends on and produces the finished extension files your browser
can load.

1. Go to [nodejs.org](https://nodejs.org/) and download the **LTS** installer
   for your operating system.
2. Run the installer and accept the default options.
3. Confirm it worked: open a terminal window (**Terminal** on macOS/Linux,
   **PowerShell** on Windows) and run:
   ```
   node --version
   npm --version
   ```
   Each should print a version number. If they don't, close and reopen the
   terminal window and try again.

### 2. Download the code

On this GitHub page:

1. Click the green **Code** button near the top of the file list.
2. Choose **Download ZIP**.
3. Unzip the file somewhere easy to find — your `Documents` folder or
   `Desktop` are both fine. Once unzipped you'll have a folder named
   something like `send-to-thebrain-main`.

If you already use `git`, you can clone instead:

```bash
git clone https://github.com/TheBrainTech/send-to-thebrain.git
```

### 3. Build the extension

Open your terminal and change into the folder you just unzipped. For example,
if you unzipped it onto your Desktop:

```bash
cd ~/Desktop/send-to-thebrain-main          # macOS / Linux
cd %USERPROFILE%\Desktop\send-to-thebrain-main   # Windows PowerShell
```

Then run these two commands, one at a time:

```bash
npm install      # downloads the libraries this project depends on
npm run build    # produces the finished extension in a new "dist" folder
```

The first command can take a minute or two the first time — it's fetching
everything the project needs. When both finish without errors, you'll have
a `dist/` folder inside your project folder. That's the Chrome / Edge /
Brave extension.

For Firefox, run this instead of `npm run build`:

```bash
npm run build:firefox
```

That creates a separate `dist-firefox/` folder with a Firefox-compatible
manifest.

> The toolbar icon PNGs are committed in `public/icons/`, so you don't need
> to regenerate them. If you change `public/logo.svg` and want to refresh
> the PNGs, run `npm run icons`.

### 4. Load the extension into your browser

**Chrome / Edge / Brave:**

1. Open `chrome://extensions` in the browser.
2. Turn on **Developer mode** (toggle in the top-right).
3. Click **Load unpacked** and choose the `dist/` folder from step 3.

**Firefox:**

1. Build with `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Choose `dist-firefox/manifest.json`.

You'll see the "Send to TheBrain" icon appear in your browser toolbar. Click
it and the popup will walk you through the one-time connection setup
described next.

## Connecting to the desktop app

The extension talks to TheBrain's desktop app over your own computer — nothing
leaves your machine. You'll copy two short values out of the desktop app and
paste them into the extension once.

1. Make sure [TheBrain's desktop app](https://thebrain.com/download) is installed and running.
2. Go to **Settings → User → Local API**.
3. Copy the **API Endpoint** (e.g. `http://localhost:52341/api/`) and your
   **API Key** — both have copy buttons.
4. In the extension popup's Setup screen (or the options page), paste both and
   press **Test connection**. If it works, you'll see your brain count.

The API key belongs to a single user — whichever user generated it.

## Updating to a newer version

When a new version of the code is published here, repeat steps 2 and 3
(download the ZIP again, then `npm install` and `npm run build`). Then go to
`chrome://extensions` and click the circular **reload** arrow on the "Send to
TheBrain" card. Your API key and settings are stored by the browser and will
carry over.

## Tests

```bash
npm test
```

Runs the Vitest suite, which covers:

- `titleSplit.test.ts` — page-title → `{ name, label }` splitter behaviour
  across all the supported separators (pipe, dash, em-dash, reverse colon,
  non-breaking space, etc.), plus leading unread-count prefix stripping.
- `endpoint.test.ts` — normalization of the pasted API endpoint
  (with/without scheme, trailing slash, `/api` suffix) into the base URL
  the client actually calls.
- `urlTrim.test.ts` — detection and stripping of query parameters and
  fragments used by the per-send "Remove query parameters" checkbox,
  plus the domain-exception matcher (exact host + subdomain).

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

## Local development

If you want to tinker with the code, `npm run dev` starts Vite in watch mode
so the extension rebuilds on save.

## Porting to Firefox / Safari

- **Firefox:** run `npm run build:firefox`, then load
  `dist-firefox/manifest.json` from `about:debugging`. Firefox MV3 uses
  `background.scripts`, so the Firefox build rewrites the generated Chrome
  `background.service_worker` entry accordingly.
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
