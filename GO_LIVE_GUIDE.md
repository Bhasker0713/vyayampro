# ⚡ VyayamPro — Go Live Guide

---

## WHAT YOU NEED (all free, no credit card)

| Tool | What for | Link |
|------|----------|------|
| Node.js | Run the app locally | nodejs.org |
| VS Code | Edit files | code.visualstudio.com |
| GitHub account | Store your code | github.com |
| Netlify account | Host it live (free) | netlify.com |
| Groq API key | Power the AI chat | console.groq.com |

---

## STEP 1 — Install Node.js (5 min, one-time)

1. Go to **https://nodejs.org**
2. Click the big green **"LTS"** button → download
3. Run the installer, click Next all the way through
4. Confirm it worked — open Terminal (Mac) or Command Prompt (Windows):
   ```
   node --version
   ```
   Should show something like: `v20.11.0` ✅

---

## STEP 2 — Install Netlify CLI (2 min)

In Terminal / Command Prompt:
```
npm install -g netlify-cli
```
Wait for it to finish. Then confirm:
```
netlify --version
```

---

## STEP 3 — Get your free Groq API key (2 min)

1. Go to **https://console.groq.com**
2. Click **"Sign Up"** — use your Google account (no credit card needed)
3. In the left sidebar click **"API Keys"**
4. Click **"Create API Key"**
5. Name it: `vyayampro`
6. **Copy the key** — it starts with `gsk_...`
7. Keep it somewhere safe — you'll need it in Step 5

---

## STEP 4 — Set up the project on your computer (3 min)

1. Unzip the `vyayampro.zip` file to your Desktop
2. Open Terminal / Command Prompt
3. Navigate to the folder:
   ```
   cd Desktop/vyayampro
   ```
4. Install dependencies:
   ```
   npm install
   ```
   (takes about 30 seconds)

---

## STEP 5 — Add your Groq key (1 min)

1. In the vyayampro folder, find the file called `.env.example`
2. Make a copy and rename it to `.env.local`
3. Open `.env.local` in VS Code or any text editor
4. Replace `gsk_your_key_here` with your real key from Step 3:
   ```
   GROQ_API_KEY=gsk_abc123...your_actual_key
   ```
5. Save the file

---

## STEP 6 — Test it on your computer (2 min)

In Terminal (in the vyayampro folder):
```
netlify dev
```

Open your browser to: **http://localhost:8888**

You should see VyayamPro! Test:
- ✅ Disclaimer screen appears first
- ✅ All 8 tabs work
- ✅ Click "AI Coach" tab — chat with the bot
- ✅ Log an exercise in the Workout tab

---

## STEP 7 — Put code on GitHub (5 min)

1. Go to **https://github.com** → sign in (or create free account)
2. Click the **"+"** icon top right → **"New repository"**
3. Name: `vyayampro`
4. Keep it **Public** (required for free Netlify)
5. Click **"Create repository"**
6. On the next page, click **"uploading an existing file"**
7. Drag and drop the entire `vyayampro` folder contents
   ⚠️ IMPORTANT: Do NOT upload `.env.local` — it has your secret key!
   The `.gitignore` file prevents it automatically, but double-check.
8. Click **"Commit changes"**

---

## STEP 8 — Deploy on Netlify (5 min)

1. Go to **https://netlify.com** → click **"Sign Up"** → use GitHub account
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"** → authorize → find and click `vyayampro`
4. Build settings — should be auto-filled. Verify:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
5. Click **"Deploy site"**
6. Wait 60–90 seconds → you'll see **"Published"** ✅

---

## STEP 9 — Add your Groq key to Netlify (2 min)

⚠️ The site is live but the AI won't work yet — you need to add the key.

1. In Netlify, click your site name
2. Click **"Site configuration"** in the left sidebar
3. Click **"Environment variables"**
4. Click **"Add a variable"**
5. Fill in:
   - **Key:** `GROQ_API_KEY`
   - **Value:** your `gsk_...` key from Step 3
6. Click **"Save"**
7. Go to **"Deploys"** → click **"Trigger deploy"** → **"Deploy site"**
8. Wait 60 seconds...

---

## ✅ YOU'RE LIVE!

Netlify gives you a URL like:
**https://vyayampro-abc123.netlify.app**

Send this to anyone — works on phone and desktop!

---

## TROUBLESHOOTING

**AI Chat shows "GROQ_API_KEY not configured"**
→ You missed Step 9. Go back and add the key in Netlify environment variables.

**App builds but shows blank page**
→ Open browser developer tools (F12) → Console tab → copy the error → paste it here

**"npm install" fails**
→ Make sure Node.js is installed correctly. Run `node --version` first.

**netlify dev doesn't work**
→ Run `npm install -g netlify-cli` again, then try `netlify dev` again

**Groq rate limit error in AI chat**
→ Wait 1 minute. Groq has a free rate limit — ~30 requests/minute. More than enough for personal use.

---

## CUSTOM DOMAIN (optional, later)

Once live, you can add your own domain (e.g. vyayampro.com):
1. Buy domain from Namecheap or GoDaddy (~$12/year)
2. In Netlify → Domain management → Add custom domain
3. Follow the DNS instructions

---

## SHARING THE APP

Your live URL works on:
- ✅ iPhone Safari (add to home screen for app-like experience)
- ✅ Android Chrome
- ✅ Desktop browser
- ✅ Any device with internet

To install on iPhone:
1. Open the URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. It looks and feels like a real app!
