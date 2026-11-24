# Home since

**Your selfie, in the betterhomes ad from the year Dubai became home.**

A Cadbury-style generative campaign feature: somebody uploads a selfie, tells us
their community and the year they moved to Dubai, and we put them in a classic
betterhomes ad from that era — a 1986 newspaper classified, a 1994 brochure, a
2006 roadside billboard, a 2015 magazine cover, or a post from today.

The photograph is AI generated. Everything else on the poster — paper, headline,
logo lockup, the `HOME SINCE 2009 · ARABIAN RANCHES` plaque — is a fixed
betterhomes design drawn in code, so the brand layout never depends on what an
image model decides to render.

## Run it

```bash
npm install
```

```bash
npm start
```

Then open http://localhost:3000.

Out of the box `PORTRAIT_PROVIDER=none`, so no AI calls are made: the browser
restyles the selfie with a per-era canvas filter (grading, bloom, grain,
vignette, and a 45° halftone screen for the newsprint ad). That is the prototype
mode — it's free, instant, and good enough to review the layouts.

## Turn on real AI portraits

Copy `.env.example` to `.env` and set a provider:

```bash
cp .env.example .env
```

| Variable | What it does |
| --- | --- |
| `PORTRAIT_PROVIDER` | `openai`, `gemini` or `none` |
| `OPENAI_API_KEY` / `OPENAI_IMAGE_MODEL` | OpenAI image edits, default `gpt-image-1` |
| `GEMINI_API_KEY` / `GEMINI_IMAGE_MODEL` | Gemini image, default `gemini-2.5-flash-image` |
| `MAX_UPLOAD_MB` | Selfie size limit, default 8 |
| `GENERATION_TIMEOUT_MS` | Give-up time per portrait, default 90000 |

The server must be able to reach the provider's host, so allow
`api.openai.com` or `generativelanguage.googleapis.com` in whatever network
policy the deployment sits behind.

**If a generation fails or times out, the request does not error.** The server
answers `mode: "filter"` with a reason, and the browser falls back to the era
filter so the person still gets a poster. The reason is shown under the result.

### Adding another provider

Drop a module in `server/providers/` exporting `id`, `isConfigured(env)` and
`generate({ imageBuffer, mimeType, prompt, env, signal }) -> { dataUrl }`, then
register it in `server/providers/index.js`.

## The eras

`shared/eras.js` is the single source of truth, loaded by both the browser and
the server. Each entry carries the year range, the canvas grading, the poster
template name, the palette, the ad copy, and the prompt fragments.

| Years | Ad | Look |
| --- | --- | --- |
| up to 1989 | The Classified | Soft-focus warm black and white, newsprint halftone |
| 1990–1999 | The Brochure | Flash film photo, rich colour, slight grain |
| 2000–2009 | The Billboard | Early digital, bright and a little flat |
| 2010–2019 | The Cover | Clean, modern, natural colour |
| 2020 on | The Post | Phone camera, true colour |

To add or re-tune an ad: add an entry to `ERAS`, then add a matching draw
function to `TEMPLATES` in `public/js/templates.js`. Posters render at
1080×1350 for social.

## Layout

```
shared/eras.js            era + ad definitions (browser and server)
server/index.js           express app, /api/portrait, /api/health
server/prompts.js         the instruction sent to the image model
server/providers/         openai.js, gemini.js, registry
public/index.html         the three-step page
public/js/filters.js      era grading, halftone, upload downscaling
public/js/templates.js    the five fixed ad designs
public/js/app.js          form, developing state, share and download
```

## Consent and privacy

- The tick box is required. `POST /api/portrait` rejects anything without
  `consent: true`.
- Selfies are held in memory for the length of the request and passed to the
  provider; nothing is written to disk and there is no database.
- Every poster carries a credit line naming the era look and whether the image
  was AI generated or filtered.
- The prompt tells the model to keep the person's likeness and explicitly not to
  beautify, slim or lighten them.

Before this goes live, check the chosen provider's terms on uploading photos of
real people, and add the campaign's own privacy wording to the footer.

## Known gaps

- No rate limiting or abuse protection on `/api/portrait` — add both before any
  public launch.
- No moderation pass on uploads; most providers refuse obvious cases themselves,
  but the campaign will want its own check.
- The ad copy is placeholder written for the prototype, not approved marketing
  copy.
