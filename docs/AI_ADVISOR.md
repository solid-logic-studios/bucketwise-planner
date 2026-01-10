# AI Advisor

The AI Advisor is an optional financial guidance feature powered by Google Gemini 2.5 Flash. It's disabled by default and requires a free API key to enable.

## What It Does

- **Analyzes your budget:** Reads current income, debts, bucket allocations, and transactions
- **Provides personalized advice:** Suggests financial strategies based on Barefoot Investor methodology
- **Context-aware:** Understands your debt priorities, bucket allocations, and spending patterns
- **Real-time:** Advice is based on live budget data (not historical)

## How It Works

1. You type a financial question in the chat bubble (top-right header)
2. Your current budget context is sent to Google Gemini API
3. Gemini analyzes your data and responds with advice
4. Conversation updates in the chat widget
5. **No chat history is permanently stored** (ephemeral context only)

## Enabling AI Advisor

### Step 1: Get a Free API Key

1. Visit [Google AI Studio](https://aistudio.google.com/) (free account required)
2. Click "Get API Key" (top-left)
3. Create a new API key
4. Copy the key to clipboard

### Step 2: Configure Backend

Edit your backend `.env` file:

```bash
GEMINI_API_KEY=your-key-from-step-1
AI_ENABLED=true
```

### Step 3: Restart Backend

**Docker Compose:**
```bash
docker compose restart backend
```

**Manual:**
```bash
# Kill the backend `pnpm dev` process and restart it
cd backend && pnpm dev
```

Wait 5-10 seconds for the backend to initialize.

### Step 4: Test

1. Open http://localhost:5555 in your browser
2. Look for the **teal chat bubble** in the top-right header
3. Click and ask a financial question

If you don't see the chat bubble, check the browser console for errors or see Troubleshooting below.

## Using the AI Advisor

### Keyboard Shortcut

Press **`⌘/`** (Cmd+Slash on Mac) or **`Ctrl+/`** (Windows/Linux) to open the chat widget instantly.

### Example Questions

- "How long will it take to pay off my debts at the current rate?"
- "Should I increase my monthly debt payment?"
- "What percentage should I allocate to Splurge vs Smile?"
- "Help me plan for a holiday using my Smile bucket"
- "Is my Fire Extinguisher percentage enough for emergencies?"

### Features

- ✅ Multi-turn conversation (follow-up questions work)
- ✅ Reads live budget data (income, debts, allocations, transactions)
- ✅ Understands Barefoot Investor principles
- ✅ Provides actionable, personalized advice
- ✅ Keyboard shortcut support (`⌘/`)
- ✅ Scrollable chat history (current session only)

## Privacy & Security

### What Is Sent to Google

When you send a message:

1. Your current budget data (income, debts, bucket allocations, transactions)
2. Your question/message
3. **Nothing else** — passwords, payment details, or personal info not included

### What Google Stores

- Messages are processed by Google Gemini API
- **No permanent chat history** — each conversation is ephemeral
- Google may use data per their [Privacy Policy](https://policies.google.com/privacy)
- Check Google's policy for API data retention details

### Best Practices

1. Never share personal identifying information in chat
2. Keep your `GEMINI_API_KEY` secret (treat like a password)
3. Don't use on shared/public computers
4. Review what data you're comfortable sending to Google

## Free Tier Limits

Google AI Studio offers a free tier with:

- **60 requests per minute** (RateLimit)
- **1.5 million tokens per day** (approximate usage)
- **Free forever** (no credit card required)

For higher usage, upgrade to Google Cloud Platform's paid plan.

## If AI Advisor Is Disabled

If you see this message:

> **AI Chat is disabled** — To enable, add `GEMINI_API_KEY` to backend `.env` and set `AI_ENABLED=true`. See [README](https://github.com/PaulAtkins88/budgetwise-planner#ai-advisor) for instructions.

Follow the "Enabling AI Advisor" section above.

## Troubleshooting

### Chat bubble doesn't appear

**Check:**
1. Is `GEMINI_API_KEY` set in backend `.env`?
2. Is `AI_ENABLED=true` in backend `.env`?
3. Did you restart the backend after changing `.env`?
4. Check browser console for errors: Press `F12` → Console tab

**Solution:**
```bash
# Verify backend configuration
cd backend
cat .env | grep GEMINI_API_KEY
cat .env | grep AI_ENABLED

# Restart backend
docker compose restart backend
# OR: Kill and re-run: pnpm dev
```

### "Error communicating with AI" or blank responses

**Likely causes:**
1. Invalid API key (typo, key revoked)
2. API quota exceeded (hit rate limit or daily limit)
3. Network issue (firewall, proxy blocking Google)
4. Backend crash

**Solutions:**
1. Regenerate API key: [Google AI Studio](https://aistudio.google.com/)
2. Wait a few minutes before trying again (rate limit)
3. Check backend logs: `docker compose logs backend | grep -i gemini` or `grep -i gemini backend.log`
4. Check your network connectivity

### "Invalid API key"

- Double-check the key is copied correctly (no extra spaces)
- Regenerate the key in [Google AI Studio](https://aistudio.google.com/)
- Ensure `GEMINI_API_KEY` is exactly as shown in AI Studio (starts with `AIza...`)

### High latency or slow responses

- First response may take 5-10 seconds (startup overhead)
- Subsequent responses typically 2-3 seconds
- Network speed affects latency
- Heavy load on Google API may add delay

## Disabling AI Advisor

If you want to turn off the chat feature:

```bash
# In backend/.env
AI_ENABLED=false
```

Or delete `GEMINI_API_KEY`:

```bash
# In backend/.env
GEMINI_API_KEY=
```

Then restart the backend. The chat bubble will disappear.

## Third-Party Dependencies

The AI Advisor requires:
- **Google Gen AI SDK** (`@google/genai` v1.34.0)
- **Google Account** (free tier)
- **Internet connection** to Google Gemini API

Core Bucketwise Planner functionality (budgeting, debts, transactions) **does not require the AI Advisor**. It's entirely optional.

## Attribution & Training Data

The AI system prompt is trained on publicly available information from Scott Pape's Barefoot Investor methodology. The AI provides advice aligned with bucket-based budgeting and debt snowball principles.

**Learn more:** [www.barefootinvestor.com](https://www.barefootinvestor.com/)

This is not endorsed by Scott Pape or The Barefoot Investor. It's community-implemented advice based on publicly available principles.

---

**Need help?** See [docs/FAQ.md](FAQ.md) or open an issue on [GitHub](https://github.com/PaulAtkins88/budgetwise-planner/issues).
