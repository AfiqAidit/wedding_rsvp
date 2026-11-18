# Wedding RSVP: Walimatul Urus card

A one-page digital invitation (Bahasa Melayu): cover with floral frame and **Buka**, greeting, couple, save the date with live countdown and calendar buttons, dress code, location, **RSVP** (name, hadir / tidak hadir, number of guests, wish), guest wishes, Salam Kaut, contacts, and a floating quick-nav bar.

Hosts see every response, totals and a CSV at `/admin` (passcode).

No dependencies, no build step. Node 20+.

## Run locally

```bash
cp .env.example .env.local     # set ADMIN_PASSCODE
npm run dev                    # http://localhost:3000   (PORT=3100 npm run dev for another port)
npm test
```

With `SUPABASE_URL` empty, responses are saved to `.data/rsvps.json` (git-ignored). Delete `.data/` to reset.

## Change the card

Everything a person edits is in **`public/config.js`**: names, date, hijri date, time, venue, map query, dress colours, Salam Kaut bank details, contact number, max guests. Section copy lives in `public/card.js`; colours and sizes in `public/card.css` (`:root` tokens at the top).

Optional assets (the card works without them):

| File | Effect |
|---|---|
| `public/audio/theme.mp3` | The theme song (A Thousand Years, orchestral). The music button shows and the song starts when the guest taps **Buka**. If the file is missing, there is no button. |
| `public/audio/theme1.mp3` | Alternate track (Until I Found You, violin). To use it, set `song` in `public/config.js` to `/audio/theme1.mp3`. |
| `public/img/wreath.webp` | Replaces the drawn SVG flowers with your own transparent image (~1040×1360 px). |

## Deploy (Vercel + Supabase, both free)

1. **Supabase:** create a project → SQL Editor → run `supabase.sql`.
   Copy the Project URL and the **service role / secret** key (Settings → API).
2. **GitHub:** push this folder as its own repo.
3. **Vercel:** import the repo (Framework preset: *Other*), then add environment variables:
   `ADMIN_PASSCODE`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, optionally `MAX_PAX`.
4. Open the URL on a phone, press Buka, submit a test RSVP, then check `/admin`.

The service key is only used inside `api/*` on the server. The table has RLS on with no policies, so the public key cannot read or write it.

## Files

| Path | What |
|---|---|
| `public/index.html` | Page shell |
| `public/config.js` | The card's details (edit this) |
| `public/card.js` | Builds the card, countdown, calendar links, RSVP form, wishes, music |
| `public/card.css` | All card styling and motion |
| `public/wreath.js` | Draws the flower wreath as SVG |
| `public/admin.html`, `style.css` | Host list, totals, CSV |
| `api/rsvp.js`, `api/wishes.js`, `api/rsvps.js` | Vercel functions: submit / public wishes / host list |
| `lib/rsvp.js` | Validation, storage (Supabase or local file), handlers |
| `dev-server.mjs` | Local server that mirrors the Vercel routes |

## Notes

- Guest wishes are shown publicly with the guest's name. There is no moderation step; to remove one, delete the row in Supabase (Table Editor).
- Spam: a hidden honeypot field; bots that fill it get a fake "success" and nothing is stored.
- Duplicates are allowed (a guest may RSVP for someone else). Check names in `/admin`.
- Keep `maxPax` in `public/config.js` equal to the `MAX_PAX` env var. The server enforces its own limit either way.
- The card is built to look like the reference design, using its own code and drawn graphics. The reference's flower artwork, its YouTube song player and the "Preview" watermark are intentionally not included.
