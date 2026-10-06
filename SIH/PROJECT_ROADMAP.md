# KrishiLink (SIH26132) — Comprehensive Team Project Roadmap & Development Plan

**Project Name:** KrishiLink: AI-Powered Farmer Market Intelligence, Direct Market Linkage & Logistics Optimization Platform  
**Problem Statement ID:** SIH26132 — Strengthening Market Linkages and Price Discovery for Farmers  
**Database:** Live Neon.db PostgreSQL Cloud Cluster  
**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma ORM v6, TailwindCSS v4, Lucide Icons, Recharts, Bcryptjs

---

## Central Core Proposition

> **"Given what a farmer has, where should it be sold, to whom, at what price, when, and through which logistics option so that the farmer receives the highest practical net realization?"**

KrishiLink combines **market intelligence + buyer discovery + price transparency + quality/trust + logistics optimization + transaction coordination + agri-waste monetization** into one unified decision and execution platform.

---

- "[x]" indicates completed steps

## Phase 1: Core Transaction MVP & Baseline Infrastructure (STATUS: COMPLETED)

All items in Phase 1 have been fully built, integrated, and verified with zero compilation errors against the live Neon PostgreSQL database.

### 1.1 Farmer Produce Listing & Inventory Management

- [x] **Farmer Registration & Profiles**: Multi-district support (Maharashtra: Nashik, Pune, Mumbai, Nagpur; Gujarat: Anand, Ahmedabad, Surat, Rajkot).
- [x] **Harvest Produce Listing Form**: Allows farmers to list crop/commodity (Tomato, Onion, Potato, Paddy, Soybean, Cotton, etc.), variety, weight in quintals, quality grade (Grade A, Grade B, Grade C), floor price (₹/quintal), and pickup location.
- [x] **My Active Crop Lots Dashboard**: Real-time management of active listings, pending buyer bids, and accepted sales contracts.

### 1.2 Direct Buyer Sourcing Marketplace & Digital Bidding

- [x] **Buyer Sourcing Market**: Wholesalers, retailers, food processors, and institutional buyers can browse active harvest listings with commodity filtering.
- [x] **Digital Bidding Engine**: Buyers place price offers per quintal on specific harvest lots.
- [x] **My Active Bids Portal**: Buyers track offer status (Pending, Accepted, Rejected) and contract fulfillment.

### 1.3 Transporter Fleet Management & Job Claiming

- [x] **Transporter Portal**: Fleet operators view available unassigned freight pickup routes.
- [x] **Job Claiming Workflow**: Transporters claim pickup jobs, update shipment status (Assigned -> In Transit -> Delivered), and confirm delivery quality.

### 1.4 Live Government Mandi Price Benchmark Feed (Agmarknet Integration)

- [x] **Live Agmarknet REST API Handler**: Integrates directly with `api.data.gov.in` using API Key `579b464db66ec23bdd000001df2b57a419f44a6d59b2fc14b89ea6f9`.
- [x] **Real-Time Price Discovery Feed**: Displays live daily arrival records, minimum price, maximum price, modal price (per quintal), and per-kg rates with search filtering across states and markets.

### 1.5 Net Realization Calculation Engine

- [x] **Net Payout Formula**:
      $$\text{Net Payout} = \text{Gross Buyer Offer Value} - \text{Platform Fee (1\%)} - \text{Logistics Freight Cost}$$
- [x] **Offer Matching & Ranking Engine**: Ranks buyer offers by the farmer's **Net Realization** (deducting distance-based logistics fees and 1% platform fee) rather than nominal gross price alone.

### 1.6 Cloud Database & Security Infrastructure

- [x] **Neon PostgreSQL Sync**: Configured Prisma schema with `postgresql` provider connected to live AWS Neon DB instance (`neondb`).
- [x] **Bcrypt Password Security**: Replaced plain-text authentication with `bcryptjs` password hashing (`bcrypt.hash` on signup, `bcrypt.compare` on login).
- [x] **Session Persistence**: Stored active session IDs and initial roles in `localStorage` so browser refreshes maintain logged-in state.

### 1.7 ADMIN Super-User Console & Quick-Swap Controls

- [x] **ADMIN Control Room (`/admin`)**: Unified dashboard displaying system KPIs (Registered Users, Active Lots, Traded Volume, Settled GMV), full user directory, and global harvest ledger.
- [x] **Quick-Swap Control**: ADMIN users can check/uncheck specific accounts in the user directory to enable/disable them in the header Quick-Swap dropdown.
- [x] **Auto-Routing Redirection**: Swapping profiles in the header dropdown automatically navigates (`router.push`) to that user's default dashboard (`/farmer`, `/buyer`, `/transporter`, `/admin`).

### 1.8 Unauthenticated Landing Page Overhaul

- [x] **Agri-Commerce OS Concept**: Unauthenticated landing page featuring gradient hero styling, glassmorphism cards, and zero-middlemen value propositions.
- [x] **Interactive Net Realization Calculator**: Interactive crop yield estimator with sliders for lot weight and benchmark price, dynamically calculating traditional mandi deductions vs KrishiLink net payout (+18% to +28% profit increase).

---

## Phase 2: Intelligence & Advanced Logistics Marketplace (STATUS: COMPLETED)

### 2.1 Transporter Custom Rates & Freight Bidding System
- [x] **Transporter Custom Rates**: Allow transporters to set their custom **Per-KM Rate** (₹/km/quintal), **Base Trip Fare**, and **Vehicle Type** (Bolero Pickup 1.5T, Eicher 14ft, 32ft Container, etc.) in their portal.
- [x] **Freight Bidding & Quote Marketplace**: Allow transporters to submit custom price quotes on unassigned harvest jobs instead of fixed fees. Buyers/farmers can select the best transporter quote based on price, vehicle capacity, ETA, and rating.
- [x] **Dynamic Freight Calculation**: Update logistics algorithms to compute freight costs using the selected transporter's custom rate.

### 2.2 GPS Location & Dynamic Route Distance Mapping
- [x] **Geospatial Coordinates**: Store exact Latitude and Longitude coordinates for pickup fields and drop fulfillment centers.
- [x] **Live Route Distance Calculation**: Integrate map routing APIs to compute exact driving distances for precise freight pricing.

### 2.3 AI Price & Demand Forecasting Models
- [x] **Price Forecasting Engine**: Predict near-term crop prices, price ranges, and market volatility over 7-day to 30-day windows.
- [x] **Demand Forecasting Engine**: Identify regional buyer demand spikes and commodity shortages to inform farmer listing decisions.

### 2.4 Sell-Now vs. Wait Decision Intelligence
- [x] **Holding Risk Calculator**: Evaluate the risk-adjusted value of holding produce in warehouse/storage vs. selling immediately:
  $$\text{Expected Value of Waiting} = \text{Expected Future Price} - \text{Storage Cost} - \text{Quality Spoilage Risk}$$

### 2.5 Multi-Factor Trust Graph & Reliability Scorecard
- [x] **Verified Reliability Scores**: Maintain objective scorecards for Farmers (fulfillment history, grade accuracy), Buyers (payment speed, cancellation rate), and Transporters (on-time pickup, damage rate).
- [x] **Interactive Post-Transaction Rating System**: 1-5 star reviews with custom comments between transaction partners, automatically recalculating target user average trust scores in Neon DB.

---

## Phase 3: Agri-Waste Monetization Marketplace (STATUS: UPCOMING)

### 3.1 Agricultural Residue Inventory Listing

- `[ ]` **Crop Waste Category**: Allow farmers to list crop residues (rice straw, wheat straw, sugarcane bagasse, husk, stalks) alongside primary produce.

### 3.2 Industrial Waste Buyer Matching

- `[ ]` **Residue Buyer Network**: Match agricultural residue listings with bio-CNG plants, cattle-feed manufacturers, mushroom growers, biomass power plants, and paper/packaging industries.

### 3.3 Biomass Aggregation & Logistics Coordination

- `[ ]` **Stubble Burning Elimination**: Group regional crop waste collections onto shared logistics trucks, turning environmental disposal burdens into secondary farmer revenue.

---

## Phase 4: Enterprise Platform & FPO Scale (STATUS: UPCOMING)

### 4.1 FPO / Cooperative Aggregation Dashboards

- `[ ]` **Bulk Harvest Aggregation**: Tools for Farmer Producer Organizations (FPOs) to pool smallholder harvests and negotiate bulk contracts with enterprise buyers.

### 4.2 Recurring Enterprise Supply Contracts

- `[ ]` **Contract Farming & Supply Commitments**: Institutional procurement workflows for large food processors, retail chains, and restaurant networks.

### 4.3 Advanced Supply Chain Analytics & SaaS Subscriptions

- `[ ]` **Regional Supply Heatmaps**: Predictive market analytics, supply forecasting dashboards, and SaaS subscription tiers for enterprise buyers and aggregators.

---

## How to Run & Verify the Project

```bash
# Install dependencies
npm install

# Push Prisma schema to Neon PostgreSQL DB
npx prisma db push

# Run development server
npm run dev

# Run production build check
npm run build
```
