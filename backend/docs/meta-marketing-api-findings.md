# Meta Marketing API — Findings, Requirements & Limitations

Research notes for integrating Facebook/Meta ad account connection, stats, and ad publishing into ClickDee. Captures what's confirmed possible, what it requires, and where the real limitations are — to inform the actual implementation plan later.

## 1. Object hierarchy

```
Business Manager → Ad Account (act_{id}) → Campaign → Ad Set → Ad → Ad Creative
```

Must be created top-down: an Ad Set needs a Campaign ID, an Ad needs an Ad Set ID + Creative ID.

## 2. Reading stats (clicks, impressions, reach, spend)

`GET /{node-id}/insights` (works on ad-account/campaign/adset/ad nodes), needs `access_token` with `ads_read` plus `fields` (e.g. `impressions,reach,clicks,ctr,spend,cpc,cpm,actions`), a date range (`date_preset` or `time_range`), optional `level` and `breakdowns`. Paginated; large ranges should use Meta's async Insights jobs instead of sync calls. Sync calls default to ~last 30 days.

Sources: [Insights API docs](https://developers.facebook.com/docs/marketing-api/insights/), [Breakdowns docs](https://developers.facebook.com/docs/marketing-api/insights/breakdowns/)

## 3. Creating/uploading/pushing ads

Needs `ads_management` (write). Order:

1. `POST /act_{id}/campaigns` (`name`, `objective`, `status`, `special_ad_categories`) → `campaign_id`
2. `POST /act_{id}/adsets` (`campaign_id`, budget fields, `billing_event`, `optimization_goal`, `targeting`, dates) → `adset_id`
3. Upload asset: `POST /act_{id}/adimages` (→ `image_hash`) or `POST /act_{id}/advideos` (→ `video_id`)
4. `POST /act_{id}/adcreatives` (`object_story_spec` referencing the hash/video ID + Page + copy) → `creative_id`
5. `POST /act_{id}/ads` (`adset_id`, `creative: {creative_id}`, `status`) — the "push live" step

Sources: [Marketing API overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api), [fbsamples/marketing-api-samples adcreation.py](https://github.com/fbsamples/marketing-api-samples/blob/master/samples/samplecode/adcreation.py)

## 4. How a client connects their Facebook Business

**Facebook Login for Business:**

1. One-time: create a Business-type Meta App, add Facebook Login + Marketing API products, define needed permissions/assets, get a Configuration ID.
2. Client clicks "Connect" → frontend calls `FB.login()` with that Configuration ID → login dialog → business user approves which Pages/ad accounts to share.
3. Token returned is either a short-lived **User access token** (tied to the person) or a long-lived **System User (Business Integration) token** (tied to the client's Business Portfolio, effectively never expires, better for server-side automated polling) — the latter needs an extra server-side auth-code exchange.
4. Store the token + authorized `act_{id}`s against the client's record; use for all subsequent calls on their behalf.

Sources: [Facebook Login for Business docs](https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business)

## 5. Required permissions/scopes

| Permission                                 | Needed for                                              |
| ------------------------------------------ | ------------------------------------------------------- |
| `ads_read`                                 | Insights/stats only                                     |
| `ads_management`                           | Create/edit/delete campaigns, ad sets, ads, creatives   |
| `business_management`                      | Reading/managing which ad accounts/pages the client has |
| `pages_show_list`, `pages_read_engagement` | Syncing connected Pages                                 |

## 6. Do we need Meta's permission? Access levels

- **Standard Access**: works immediately for accounts explicitly added as Admin/Developer/Tester under the app's Roles (e.g. our own test Business Manager + ad account). **Enough to build and demo the entire MVP end-to-end.**
- **Advanced Access**: required before _other people's_ real, non-tester Facebook Business accounts can connect. Gated behind **App Review** (use-case writeup + screen recording, ~3–7 business days once submitted) + **Business Verification**. `ads_management`/`ads_read` have a stricter "two-gate" review. This is a later step, not a development blocker.

Sources: [Update to Ads Management Standard Access (Meta blog)](https://developers.meta.com/blog/updates-to-ads-management-standard-access-feature/)

## 7. Rate limits

Marketing API uses a **Business Use Case (BUC) score** — a rolling 1-hour points budget, not a flat call count. Read calls ≈ 1 point, write calls ≈ 3 points; scores decay over a 300s window.

| Access tier | Max score | Blocked-for on hitting max |
| ----------- | --------- | -------------------------- |
| Development | 60        | 300s                       |
| Standard    | 9000      | 60s                        |

Practical implication: heavy automated polling/creation (e.g. several AI agents hitting the API concurrently) is fine at Standard tier but will throttle fast at Development tier — worth designing with backoff/retry and batched Insights calls rather than one call per metric per account.

Sources: [Rate Limiting docs](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting/), [Meta Ads API rate limits guide](https://www.bulkcreatives.com/blog/meta-ads-api-rate-limits)

## 8. AI-generated creative — disclosure requirement (relevant since ClickDee's AI would author ad content)

As of Meta's 2026 ad policy update, any creative where AI generated or substantially modified visual/audio content (AI product images, background replacement, synthetic voiceover, generated video, etc.) **must be labeled "AI-generated" at submission** in the creative's metadata. Meta auto-scans uploads for AI markers (C2PA/IPTC metadata) and flags undeclared ones; repeat/undeclared violations can reduce delivery or trigger account warnings. The EU AI Act adds a stricter, broader disclosure + C2PA watermarking requirement from August 2026 for any EU-facing ad, with penalties up to €35M/7% global revenue for non-compliance.

**Implication for ClickDee:** if the AI pipeline generates or edits ad images/video/copy, the ad-creation call must set the correct AI-disclosure field/label on the creative — this needs to be a first-class part of the creative-upload step, not an afterthought.

Sources: [Meta AI Content Label Policy 2026](https://www.auditsocials.com/blog/meta-ai-generated-content-label-policy-2026), [Meta Ads AI Disclosure Rules 2026](https://adriselab.com/blog/meta-ads-ai-disclosure-rules-2026)

## 9. Feasibility check against the actual frontend mockups

**Connections UI (`integration.tsx` / `integrationFacebook.tsx`) — all feasible**

| Field/action                                        | Feasible? | Meta source                                                                                   |
| --------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| Connected status, account name/handle               | ✅        | Set at OAuth-connect time from the Business/User profile                                      |
| Synced Pages list + toggle                          | ✅        | `/{business_id}/owned_pages` or `/me/accounts`; the "synced" toggle itself is our own DB flag |
| Ad account (name, status, currency) + active toggle | ✅        | `GET /act_{id}?fields=name,account_status,currency`; "active" toggle is our own DB flag       |
| Last sync time                                      | ✅        | Our own DB timestamp                                                                          |
| Disconnect Account                                  | ✅        | Delete stored token; optionally `DELETE /{user-id}/permissions` to revoke on Meta's side too  |

**Campaign report (`campaignReport.tsx` / `data/campaigns.ts`)**

| Field                                                    | Feasible?                       | Notes                                                                                                                              |
| -------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `reach`, `clicks`, `dailyTrend.{reach,spend}`, `adSpend` | ✅                              | Insights API (`reach`, `clicks`, `spend`), `time_increment=1` for daily trend                                                      |
| `creatives[].impressions`, `creatives[].ctr`             | ✅                              | Insights API at `level=ad`                                                                                                         |
| `budgetSpent`/`budgetTotal`/`dailyAvgSpend`              | ✅                              | Campaign/Ad Set object fields (`daily_budget`/`lifetime_budget`, `budget_remaining`), not Insights                                 |
| Start/Pause/Stop campaign buttons                        | ✅                              | `POST /{campaign_id}` (or adset/ad) with `status=ACTIVE`/`PAUSED`/`ARCHIVED`                                                       |
| "สร้างครีเอทีฟใหม่" (create new creative)                | ✅                              | Ad Creative creation flow (section 3)                                                                                              |
| `orders`, `cpa`                                          | ⚠️ Not from Marketing API alone | Needs a separate **Meta Pixel + Conversions API** integration on the client's own storefront to attribute purchases back to the ad |
| `roi`                                                    | ⚠️ Depends on `orders`/revenue  | Same gap as above                                                                                                                  |
| `roiBenchmark`                                           | ❌ Not a Meta concept           | Would be ClickDee's own computed benchmark across its client base                                                                  |
| AI insight text (`insights[]`)                           | ❌ Not from Meta                | ClickDee's own AI-generated commentary derived from the numeric metrics                                                            |

**Bottom line:** every ad-metric and campaign/ad-management action shown in the mockups is directly possible via the Marketing API. The one real gap is `orders`/`cpa`/`roi`, which needs a Pixel/Conversions API integration on the client's site — separate, larger work. `roiBenchmark` and the AI commentary are ClickDee's own logic either way.

## 10. Can AI agents on our backend actually create and push Facebook ads through a third-party site?

**Yes — mechanically, this is exactly what the Marketing API is for.** The API has no concept of "who/what" decided the campaign name, budget, targeting, or creative — it's a REST-ish HTTP interface (steps in section 3) that accepts whatever values are sent, whether a human typed them into Meta's own Ads Manager, or your backend (with one or many AI agents deciding budget/targeting/copy/creative) calls `POST /act_{id}/campaigns` → `.../adsets` → `.../adimages` → `.../adcreatives` → `.../ads` in sequence with a valid `ads_management` token. Plenty of existing ad-automation SaaS tools work exactly this way today.

**What actually gates it, in practice:**

- **Permissions** — same requirement as any other write action: a token with `ads_management` scope on the client's ad account (section 4/6). Multiple internal AI agents are just multiple callers using the same stored token/service credentials — Meta doesn't distinguish "AI agent" from "your backend."
- **Meta's Ad Review** — every ad submitted (however it was authored) goes through Meta's automated + human ad review before it actually goes live; this is unavoidable and outside your control — expect review latency (usually minutes to ~24h) between "pushed via API" and "actually serving," and design the UI/flow to reflect a pending state rather than assuming instant-live.
- **AI content disclosure** (section 8) — if an agent generated/edited the creative's image/video/copy, the creative payload must carry the AI-generated label; skipping this risks automated detection flags and delivery penalties.
- **Rate limits** (section 7) — concurrent agents creating/editing many objects need to respect the BUC score budget; at Standard tier (9000 pts/hour) this is generous but not unlimited — a burst of many agents each doing multi-step campaign creation in parallel could throttle each other.
- **Compliance responsibility stays with ClickDee** — since the app/token making the calls is ClickDee's, Meta holds the app (not the individual client) accountable for policy violations (misleading claims, prohibited content categories, repeated AI-disclosure failures, etc.). An automated multi-agent pipeline generating ad copy/creative at scale increases the importance of a policy-compliance check _before_ the final `POST /ads` call, not after.

**Net answer:** technically and permission-wise, yes — fully automated, multi-agent-authored campaign creation and publishing through your backend is a supported use case of the Marketing API, not something Meta blocks. The real engineering considerations are: token/permission scoping per client, respecting Ad Review latency in the UX, tagging AI-generated creative correctly, and rate-limit-aware orchestration if multiple agents act concurrently.
