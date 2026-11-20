# Running the extraction walkthrough

The walkthrough at **`/items/demo`** shows what Boxhawk reads off a donated
item's packaging. It needs no Supabase project, no API key, and no database —
it runs the real `lib/ocr` functions over a fixed payload on the server.

## On a fresh machine

Needs an internet connection for the first install.

### 1. Check Node

```bash
node --version
```

Node 20 or newer is required (this was developed on v20.20.2). If the command
is missing or the version is older, install it:

| Platform | Command |
| --- | --- |
| macOS, with Homebrew | `brew install node@22` |
| Windows | `winget install OpenJS.NodeJS.LTS` |
| Linux / macOS, no admin rights | see nvm below |

Without admin rights, nvm installs Node into your home directory:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL
nvm install 22
```

Otherwise the installer from <https://nodejs.org> works on every platform.
Open a new terminal afterwards, then check `node --version` again.

### 2. Get the code and start it

```bash
git clone <repo-url>
cd Medishelf-web/boxhawk-web
git checkout feature/ocr-extraction-rules

npm install          # a few minutes
npm run dev
```

Then open **http://localhost:3000/items/demo**

Nothing else is needed for the walkthrough. If `npm run dev` warns that the
Supabase keys are missing, that is expected and the page still works — login
and the review queue are what need a real project:

```bash
cp .env.example .env.local   # then fill in real values
```

## What to show

1. **The two panels.** Photographs on the left, the reviewer's form on the
   right — the same layout the real review screen uses.

2. **The badges.** Eleven fields are marked `AI read`. Two are marked
   `not on label`: they came back empty because the carton does not carry them.

3. **The toggle — "Fill the blanks the way a guessing reader would".**
   Switch it on and the form becomes complete. One of the invented values is
   the manufacturer repeated as the sponsor; the other is a manufacture date
   that was never printed. A reviewer looking at the finished form has no way
   to tell these apart from the values that were really read. This is the point
   of returning empty fields, and it matters most for dates on medical items.

4. **"Show what lib/ocr did with the response"** at the bottom, for anyone who
   wants the mechanism: the model's reply, then `validateExtraction()`, then
   `toSubmissionColumns()`.

The label image is drawn, not photographed, and the product and manufacturer
are invented — the page says so. To walk through it with real photographs, drop
them into `public/demo/` and edit `SAMPLE_IMAGES` in
`app/items/demo/page.jsx`.

## Offline fallback

If the venue has no usable internet, copy the whole `boxhawk-web` directory
(including `node_modules` and `.next`) to the other machine on a USB drive and
run `npm run dev` there. Skipping `npm install` avoids the only step that needs
the network.

## Checking the rules themselves

Runs on Node alone — no install, no key, no database:

```bash
npm test                                        # 14 cases over the extraction rules
node scripts/extract-demo.mjs --dry-run x.jpg   # the exact request, without sending it
```

## Running a real extraction

Needs `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `.env.local`, plus a
Supabase project holding the submission and its images. `OPENROUTER_MODEL` must
be a pinned `provider/model` slug — floating aliases are rejected at startup.

Before the review screen can show provenance on real items, run
`database/add_extraction_provenance.sql` against the Supabase project.
