# Home since

**Star in the betterhomes ad from the year Dubai became home.**

A generative campaign tool built on the same mechanic as Cadbury's *My Cadbury
Era* (VCCP / Bernadette, 2024), rebranded for betterhomes: pick a classic ad
from the archive, say how you want to be depicted, add a selfie, and the tool
puts you in that ad.

The photograph is AI generated. Everything else on the poster — paper,
headline, logo lockup, the `HOME SINCE 2009 · ARABIAN RANCHES` plaque — is a
fixed betterhomes design drawn in code, so the brand layout never depends on
what an image model decides to render.

## The journey

Cloned from the Cadbury flow, one question per screen:

1. **Age gate** — "Are you 18 or over?"
2. **Pick your poster** — seven classic betterhomes ads. Entering the year you
   moved to Dubai badges one as `YOUR ERA` and preselects it, but any of the
   seven can be chosen.
3. **How should we picture you?** — skin tone, and feminine / masculine /
   gender neutral. These go into the prompt so people are depicted as they
   choose rather than as a model guesses. Community is captured here too.
4. **The selfie** — upload, drag and drop, or take one now. Consent tick box.
5. **Developing** — progress screen while the portrait generates.
6. **Your ad** — share, download, or try another era keeping the same selfie.

Cadbury's version queued for up to an hour and emailed the result. This one
generates in seconds, so the wait is on-page.

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
vignette, and a 45° halftone screen for the newsprint ad). That is the
prototype mode — free, instant, and good enough to review the layouts. The
result screen says plainly when a poster used the filter rather than a model.

## Turn on real AI portraits

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

The server must reach the provider's host, so allow `api.openai.com` or
`generativelanguage.googleapis.com` in whatever network policy the deployment
sits behind.

**If a generation fails or times out, the request does not error.** The server
answers `mode: "filter"` with a reason, the browser falls back to the era
filter, and the reason is shown on the result screen.

### Adding another provider

Drop a module in `server/providers/` exporting `id`, `isConfigured(env)` and
`generate({ imageBuffer, mimeType, prompt, env, signal }) -> { dataUrl }`, then
register it in `server/providers/index.js`.

## The seven ads

`shared/eras.js` is the single source of truth, loaded by both the browser and
the server. Each entry carries the year range, canvas grading, poster template,
palette, ad copy and prompt fragments.

| Years | Ad | Look |
| --- | --- | --- |
| up to 1989 | The Classified | Soft-focus warm black and white, newsprint halftone |
| 1990–1997 | The Brochure | Flash film, rich colour, grain |
| 1998–2003 | The Six Sheet | Late film, punchy colour, bus-stop poster |
| 2004–2009 | The Billboard | Early digital, bright and a little flat |
| 2010–2015 | The Property Guide | First DSLR era, warm and sharp, listings page |
| 2016–2020 | The Cover | Clean, modern, natural colour |
| 2021 on | The Post | Phone camera, true colour |

To add or re-tune an ad: add an entry to `ERAS`, then add a matching draw
function to `TEMPLATES` in `public/js/templates.js`. Posters render at
1080×1350 for social.

## Layout

```
shared/eras.js            ads, skin tones, presentations (browser and server)
server/index.js           express app, /api/portrait, /api/health
server/prompts.js         the instruction sent to the image model
server/providers/         openai.js, gemini.js, registry
public/index.html         the seven wizard screens
public/js/filters.js      era grading, halftone, upload downscaling
public/js/templates.js    the seven fixed ad designs
public/js/app.js          step machine, pickers, share and download
```

## Consent and privacy

- Age gate and consent tick box are both enforced server-side:
  `POST /api/portrait` rejects anything without `over18: true` and
  `consent: true`.
- Selfies are held in memory for the length of the request and passed to the
  provider; nothing is written to disk and there is no database.
- The prompt tells the model to keep the person's likeness and explicitly not
  to beautify, slim or lighten them.
- Every poster carries a credit line naming the era and whether the image was
  AI generated or filtered.

## Known gaps

- **No rate limiting or abuse protection** on `/api/portrait`. Needed before
  any public launch, since every call costs money.
- **No prize draw.** Cadbury's version entered people into a £200 draw and
  captured an email. Nothing here collects an email address; adding that means
  a CRM integration, a privacy notice and draw T&Cs.
- **No moderation pass** on uploads beyond what the provider does itself.
- **The ad copy is placeholder** written for the prototype — "A better way
  home", "Live the new Dubai", the phone numbers — not approved marketing copy,
  and the ads are new designs in period style rather than reproductions of real
  betterhomes archive ads. If real archive ads exist, swapping them in is a
  matter of replacing each template's draw function.

Before launch, check the chosen provider's terms on uploading photographs of
real people.
