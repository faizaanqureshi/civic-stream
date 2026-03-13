# CivicStream — Canadian Civic Engagement Demo

**From the House of Commons to City Hall — In Your Pocket**

CivicStream is a polished interactive demo for investor presentations showcasing a Canadian civic engagement app that unifies Federal, Provincial, and Municipal government data into a single mobile-first feed.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Demo Flow (5-Minute Investor Presentation)

This app is designed for this exact walkthrough:

### Step 1: Onboarding Magic
- Open `/onboarding`
- Type "L9T"
- Watch the detection animation (1.5 seconds)
- See Milton, Ontario detected with riding info
- Preview of 3 representatives
- Click "Start My Civic Feed"

**Wow Factor**: Instant riding detection with animated reveal

### Step 2: Unified Feed
- View "All" tab (15+ items)
- Watch for "Breaking" item to slide in after 2 seconds
- Click "Municipal" tab to filter (5 items)
- Point out NEW badges and urgency indicators

**Wow Factor**: Live-feeling feed with pull-to-refresh simulation

### Step 3: Bill Detail with AI Summary
- Click "Bill 23: More Homes Built Faster Act" from feed
- Scroll through sections:
  - Animated progress stepper (pulsing current stage)
  - AI-generated plain-language summary
  - For/Against debate panel
  - Lobby disclosures (BILD vs Environmental Defence)
- Click "Email your MPP"

**Wow Factor**: AI summary + lobby transparency

### Step 4: Zoning Watch Map
- Navigate to Map via bottom nav
- See Milton with 4 colored markers
- Click red marker (Derry Heights - high urgency)
- Click "Related Bill" chip to jump to /bill/bill-4

**Wow Factor**: Geographic context linking to legislation

### Step 5: Gamification & Streaks
- Navigate to Profile
- See 10-day streak with flame icon
- View 3 earned badges (full color) and 3 locked badges (grayed)
- Scroll activity history

**Wow Factor**: Engagement mechanics drive daily usage

### Step 6: Representative Dashboard
- Navigate to Reps
- See all 4 cards: MP, MPP, Mayor, Councillor
- Expand Adam van Koeverden to view lobby meetings
- Click "Email" button (opens mailto:)

**Wow Factor**: Accountability through attendance tracking and lobby disclosure

## 🎯 Key Features

### ✅ Implemented Demo Features
- **Postal code onboarding** with simulated riding detection
- **Unified feed** across Federal/Provincial/Municipal levels
- **Bill detail pages** with AI summaries, For/Against panels, progress tracking
- **Zoning Watch map** with Leaflet.js showing Milton geography
- **Gamification system** with 10-day streak and badge collection
- **Rep dashboard** with attendance tracking and lobby disclosures
- **Responsive design** optimized for mobile (390px) and desktop (1440px)

### 🎨 Design System
- **Colors:**
  - Federal: #D71920 (red)
  - Provincial: #003F8A (blue)
  - Municipal: #2D7A45 (green)
  - Brand: #0F9B7A (teal)
- **Typography:** Geist Sans
- **Animations:** Framer Motion for page transitions and feed item reveals

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React Context + useReducer |
| Map | Leaflet.js + react-leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | Framer Motion |
| Data | Local JSON fixtures |

## 📂 Project Structure

```
civicstream/
├── app/                      # Next.js pages
│   ├── onboarding/           # Postal code entry
│   ├── feed/                 # Main feed
│   ├── bill/[id]/            # Bill detail
│   ├── zoning/               # Map view
│   ├── reps/                 # Representatives
│   └── profile/              # Gamification
├── components/
│   ├── nav/                  # Navigation bars
│   ├── feed/                 # Feed items & filters
│   ├── bill/                 # Bill components
│   ├── reps/                 # Rep cards
│   ├── map/                  # Zoning map
│   ├── gamification/         # Badges & streaks
│   └── ui/                   # Primitives
├── context/
│   └── CivicStreamContext.tsx # Global state
├── lib/
│   ├── hooks/                # Data hooks
│   └── utils/                # Helpers
├── types/
│   └── index.ts              # TypeScript defs
└── data/                     # JSON fixtures
    ├── reps.json
    ├── bills.json
    ├── feed.json
    ├── zoningAlerts.json
    └── badges.json
```

## 🔄 Upgrading to Production

This demo uses fixture data throughout. To upgrade to a real production app, replace the hooks in `lib/hooks/` with real API calls:

| Feature | Demo Implementation | Production Upgrade |
|---------|-------------------|-------------------|
| **Riding Detection** | `useRiding` returns `data/reps.json` | Fetch from [Represent API](https://represent.opennorth.ca/api/) using postal code |
| **Bill Data** | `useDemoData` returns `data/bills.json` | Fetch from [Open Parliament API](https://openparliament.ca/api/) or custom scraper |
| **Feed Items** | Static `data/feed.json` | Aggregate from multiple sources: Hansard, Provincial Legislature, Municipal agendas |
| **Zoning Alerts** | Static `data/zoningAlerts.json` | Pull from municipal open data portals (Milton: [data.milton.ca](https://data.milton.ca)) |
| **User State** | LocalStorage via Context | Supabase database with user authentication |
| **AI Summaries** | Pre-written in fixtures | Generate via [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) or OpenAI API |

### File-Level Upgrade Map

| File | Line | What to Change |
|------|------|---------------|
| `lib/hooks/useDemoData.ts` | 10-18 | Replace JSON imports with `fetch('/api/data')` |
| `lib/hooks/useRiding.ts` | 14-20 | Call Represent API: `fetch('https://represent.opennorth.ca/postcodes/' + postal)` |
| `context/CivicStreamContext.tsx` | 33-45 | Replace localStorage with Supabase client calls |
| `components/bill/BillSummary.tsx` | N/A | Add "Regenerate Summary" button → Workers AI API |

## 🎮 Demo Controls

- **Press "D" key**: Toggle DEMO watermark on/off
- **Reset Demo**: Profile page → "Reset Demo" button → Returns to onboarding with fresh state

## 📝 Environment Setup

No environment variables required for demo mode. For production:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLOUDFLARE_WORKERS_AI_API_KEY=
REPRESENT_API_KEY=  # Optional, API is public
```

## 🚢 Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

Deploy to Vercel:
```bash
vercel --prod
```

## 🏗 Development Notes

### Adding New Data
1. Add fixture to `data/*.json`
2. Update types in `types/index.ts`
3. Import in `lib/hooks/useDemoData.ts`
4. Create component in `components/`
5. Add page route in `app/`

### Modifying Jurisdiction Colors
Edit `lib/utils/jurisdiction.ts` to change Federal/Provincial/Municipal color schemes.

### Custom Badges
Add to `data/badges.json` with Lucide icon name. Available icons: [lucide.dev/icons](https://lucide.dev/icons)

## 📄 License

Proprietary — Demo build for CivicStream investor presentations.

## 🙋 Support

For questions about this demo:
- Check the investor deck for product vision
- Review fixture data in `data/` folder for content examples
- Inspect components for UI patterns

---

**Built with ❤️ for Canadian civic engagement**
