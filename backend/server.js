const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config();

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "sponzobd";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "..")));

let paymentCollection;
let sponseeUsersCollection;
let sponsorHomeStatesCollection;
let chatDealsCollection;
let chatMessagesCollection;

class InMemoryCollection {
  constructor(keyField) {
    this.keyField = keyField;
    this.rows = new Map();
  }

  async findOne(filter) {
    const key = filter?.[this.keyField];
    if (key === undefined) return null;
    return this.rows.get(String(key)) || null;
  }

  async updateOne(filter, update, options = {}) {
    const key = filter?.[this.keyField];
    if (key === undefined) {
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    const stringKey = String(key);
    const existing = this.rows.get(stringKey);
    if (!existing && !options.upsert) {
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    const base = existing ? { ...existing } : {};
    if (!existing && update?.$setOnInsert) {
      Object.assign(base, update.$setOnInsert);
    }
    if (update?.$set) {
      Object.assign(base, update.$set);
    }

    base[this.keyField] = stringKey;
    this.rows.set(stringKey, base);

    return {
      acknowledged: true,
      matchedCount: existing ? 1 : 0,
      modifiedCount: 1,
      upsertedCount: existing ? 0 : 1,
    };
  }

  async createIndex() {
    return `${this.keyField}_idx`;
  }
}

class InMemoryMessageCollection {
  constructor() {
    this.rows = [];
    this.seq = 1;
  }

  async insertOne(doc) {
    const now = new Date();
    const row = {
      ...doc,
      _id: String(this.seq++),
      createdAt: doc.createdAt || now.toISOString(),
    };
    this.rows.push(row);
    return { acknowledged: true, insertedId: row._id };
  }

  async findByDeal(dealId, options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 50), 200));
    const after = options.after ? String(options.after) : "";
    const filtered = this.rows
      .filter((row) => row.dealId === dealId)
      .filter((row) => (!after ? true : String(row.createdAt) > after))
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    return filtered.slice(-limit);
  }

  async createIndex() {
    return "memory_messages_idx";
  }
}

const defaultSponseeSnapshot = {
  stats: {
    profileStrength: 92,
    followers: "52K",
    dealsDone: 7,
    rating: 4.8,
  },
  counts: {
    unreadMessages: 2,
    activeDeals: 2,
    applications: 11,
  },
  campaigns: [
    {
      id: "cmp-gf",
      brand: "GreenFresh BD",
      title: "National Health Week",
      budget: "20000-40000",
      channels: ["Instagram", "YouTube"],
      location: "Nationwide",
      status: "active",
    },
    {
      id: "cmp-nl",
      brand: "NutriLife Bangladesh",
      title: "Ramadan Wellness Series",
      budget: "15000-25000",
      channels: ["Instagram"],
      location: "Dhaka, Chittagong",
      status: "active",
    },
    {
      id: "cmp-tb",
      brand: "Tasty Bites BD",
      title: "Eid Menu Launch",
      budget: "12000-22000",
      channels: ["TikTok"],
      location: "Dhaka",
      status: "pending",
    },
  ],
};

function buildSponseeSnapshot(user) {
  const displayName =
    user?.displayName?.trim() || user?.profile?.handle?.trim() || "Lamia Akter";
  const followers = user?.profile?.followers?.trim() || "52K";
  const category = user?.category || "Health & wellness";

  return {
    user: {
      phone: user?.phone || "",
      displayName,
      category,
      platform: user?.platform || "Instagram",
      handle: user?.profile?.handle || "",
      followers,
      location: user?.profile?.location || "Dhaka",
      language: user?.profile?.language || "Bangla",
      bio: user?.profile?.bio || "",
      rateFrom: user?.profile?.rateFrom || "",
      rateTo: user?.profile?.rateTo || "",
      profilePhotoUrl: user?.profile?.profilePhotoUrl || "",
      coverPhotoUrl: user?.profile?.coverPhotoUrl || "",
      about: user?.profile?.about || user?.profile?.bio || "",
      nichePrimary: user?.profile?.nichePrimary || category,
      nicheSecondary: user?.profile?.nicheSecondary || [],
      sponsorshipRates: {
        instagramReel:
          user?.profile?.sponsorshipRates?.instagramReel || "18,000",
        instagramStories:
          user?.profile?.sponsorshipRates?.instagramStories || "8,000",
        tiktokVideo: user?.profile?.sponsorshipRates?.tiktokVideo || "10,000",
        fullPackage: user?.profile?.sponsorshipRates?.fullPackage || "35,000",
      },
      sponsorshipRateEntries: Array.isArray(
        user?.profile?.sponsorshipRateEntries,
      )
        ? user.profile.sponsorshipRateEntries
        : [
            { platform: "Instagram reel", price: "18,000" },
            { platform: "Instagram stories x3", price: "8,000" },
            { platform: "TikTok video", price: "10,000" },
            { platform: "Full campaign package", price: "35,000" },
          ],
      collaboration: {
        dealType:
          user?.profile?.collaboration?.dealType || "Long-term partnership",
        languages:
          user?.profile?.collaboration?.languages || "Bangla · English",
        turnaround:
          user?.profile?.collaboration?.turnaround || "5-7 business days",
        revisions:
          user?.profile?.collaboration?.revisions || "1 included per deal",
        giftingOnly:
          user?.profile?.collaboration?.giftingOnly === true ? "Yes" : "No",
      },
      platformPreference:
        user?.profile?.platformPreference || user?.platform || "Instagram",
      platformPresence: {
        instagram: {
          handle:
            user?.profile?.platformPresence?.instagram?.handle ||
            "@lamia.wellness",
          followers:
            user?.profile?.platformPresence?.instagram?.followers || "38,200",
          engagement:
            user?.profile?.platformPresence?.instagram?.engagement || "5.2%",
          reach: user?.profile?.platformPresence?.instagram?.reach || "~42K",
        },
        tiktok: {
          handle:
            user?.profile?.platformPresence?.tiktok?.handle || "@lamia_health",
          followers:
            user?.profile?.platformPresence?.tiktok?.followers || "14,200",
          engagement:
            user?.profile?.platformPresence?.tiktok?.engagement || "3.8%",
          reach: user?.profile?.platformPresence?.tiktok?.reach || "~28K",
        },
      },
      audienceOverview:
        user?.profile?.audienceOverview ||
        "Ideal for women's health, beauty, and lifestyle brands.",
      audienceDetails: {
        age: {
          genZ16to24:
            Number(user?.profile?.audienceDetails?.age?.genZ16to24) || 95,
          adults25to34:
            Number(user?.profile?.audienceDetails?.age?.adults25to34) || 68,
          adults35to44:
            Number(user?.profile?.audienceDetails?.age?.adults35to44) || 34,
          seniors45plus:
            Number(user?.profile?.audienceDetails?.age?.seniors45plus) || 14,
        },
        gender: {
          femalePercent:
            Number(user?.profile?.audienceDetails?.gender?.femalePercent) || 72,
          malePercent:
            Number(user?.profile?.audienceDetails?.gender?.malePercent) || 28,
          femaleLabel:
            user?.profile?.audienceDetails?.gender?.femaleLabel ||
            "Primarily female",
          maleLabel:
            user?.profile?.audienceDetails?.gender?.maleLabel || "Minor male",
        },
        geography: Array.isArray(user?.profile?.audienceDetails?.geography)
          ? user.profile.audienceDetails.geography
          : [
              { name: "Dhaka", tag: "Primary", tone: "primary" },
              {
                name: "Chittagong",
                tag: "Secondary",
                tone: "secondary",
              },
              { name: "Sylhet", tag: "Secondary", tone: "secondary" },
              { name: "Other BD", tag: "Present", tone: "present" },
            ],
      },
    },
    ...defaultSponseeSnapshot,
  };
}

function sanitizeProfileUpdate(payload = {}) {
  const cleanText = (value, max = 300) =>
    String(value || "")
      .trim()
      .slice(0, max);

  const safeUrl = (value) => {
    const url = cleanText(value, 250000);
    if (!url) return "";
    return /^https?:\/\//i.test(url) || /^data:image\//i.test(url) ? url : "";
  };

  const cleanPercent = (value, fallback = 0) => {
    const num = Number(String(value || "").replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, Math.min(100, Math.round(num)));
  };

  const nicheSecondary = Array.isArray(payload.nicheSecondary)
    ? payload.nicheSecondary
        .map((item) => cleanText(item, 40))
        .filter(Boolean)
        .slice(0, 6)
    : cleanText(payload.nicheSecondary, 220)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);

  return {
    displayName: cleanText(payload.displayName, 80),
    location: cleanText(payload.location, 80),
    profilePhotoUrl: safeUrl(payload.profilePhotoUrl),
    coverPhotoUrl: safeUrl(payload.coverPhotoUrl),
    about: cleanText(payload.about, 1500),
    nichePrimary: cleanText(payload.nichePrimary, 80),
    nicheSecondary,
    rateFrom: cleanText(payload.rateFrom, 30),
    rateTo: cleanText(payload.rateTo, 30),
    sponsorshipRates: {
      instagramReel: cleanText(payload.sponsorshipRates?.instagramReel, 30),
      instagramStories: cleanText(
        payload.sponsorshipRates?.instagramStories,
        30,
      ),
      tiktokVideo: cleanText(payload.sponsorshipRates?.tiktokVideo, 30),
      fullPackage: cleanText(payload.sponsorshipRates?.fullPackage, 30),
    },
    sponsorshipRateEntries: Array.isArray(payload.sponsorshipRateEntries)
      ? payload.sponsorshipRateEntries
          .map((item) => ({
            platform: cleanText(item?.platform, 80),
            price: cleanText(item?.price, 30),
          }))
          .filter((item) => item.platform && item.price)
          .slice(0, 8)
      : [],
    collaboration: {
      dealType: cleanText(payload.collaboration?.dealType, 80),
      languages: cleanText(payload.collaboration?.languages, 80),
      turnaround: cleanText(payload.collaboration?.turnaround, 80),
      revisions: cleanText(payload.collaboration?.revisions, 80),
      giftingOnly:
        String(payload.collaboration?.giftingOnly || "").toLowerCase() ===
        "yes",
    },
    platformPreference: cleanText(payload.platformPreference, 40),
    platformPresence: {
      instagram: {
        handle: cleanText(payload.platformPresence?.instagram?.handle, 80),
        followers: cleanText(
          payload.platformPresence?.instagram?.followers,
          30,
        ),
        engagement: cleanText(
          payload.platformPresence?.instagram?.engagement,
          20,
        ),
        reach: cleanText(payload.platformPresence?.instagram?.reach, 30),
      },
      tiktok: {
        handle: cleanText(payload.platformPresence?.tiktok?.handle, 80),
        followers: cleanText(payload.platformPresence?.tiktok?.followers, 30),
        engagement: cleanText(payload.platformPresence?.tiktok?.engagement, 20),
        reach: cleanText(payload.platformPresence?.tiktok?.reach, 30),
      },
    },
    audienceOverview: cleanText(payload.audienceOverview, 500),
    audienceDetails: {
      age: {
        genZ16to24: cleanPercent(payload.audienceDetails?.age?.genZ16to24, 95),
        adults25to34: cleanPercent(
          payload.audienceDetails?.age?.adults25to34,
          68,
        ),
        adults35to44: cleanPercent(
          payload.audienceDetails?.age?.adults35to44,
          34,
        ),
        seniors45plus: cleanPercent(
          payload.audienceDetails?.age?.seniors45plus,
          14,
        ),
      },
      gender: {
        femalePercent: cleanPercent(
          payload.audienceDetails?.gender?.femalePercent,
          72,
        ),
        malePercent: cleanPercent(
          payload.audienceDetails?.gender?.malePercent,
          28,
        ),
        femaleLabel: cleanText(
          payload.audienceDetails?.gender?.femaleLabel,
          40,
        ),
        maleLabel: cleanText(payload.audienceDetails?.gender?.maleLabel, 40),
      },
      geography: Array.isArray(payload.audienceDetails?.geography)
        ? payload.audienceDetails.geography
            .map((item) => ({
              name: cleanText(item?.name, 40),
              tag: cleanText(item?.tag, 24),
              tone: ["primary", "secondary", "present"].includes(
                String(item?.tone || "").toLowerCase(),
              )
                ? String(item.tone).toLowerCase()
                : "present",
            }))
            .filter((item) => item.name)
            .slice(0, 4)
        : [],
    },
  };
}

const defaultSponsorHomeState = {
  profile: {
    phone: "01700000000",
    displayName: "GreenFresh BD",
    industry: "Health & food",
    location: "Dhaka",
    plan: "Pro",
    initials: "GF",
    subtitle: "Health & food · Dhaka",
  },
  brandProfile: {
    brandName: "GreenFresh BD",
    industry: "Health & food",
    location: "Dhaka",
    country: "Bangladesh",
    tagline:
      "Organic health food products for health-conscious Bangladeshi consumers",
    about:
      "GreenFresh BD produces organic and natural health food products for health-conscious Bangladeshi consumers. Our range includes superfoods, health snacks, and nutrition supplements formulated for South Asian dietary needs.\n\nWe partner with health and wellness creators who believe in authentic nutrition content - not scripted ads. Every campaign we run is designed to feel like a genuine recommendation, not a commercial.",
    website: "https://greenfreshbd.com",
    typicalBudget: "৳20,000 - ৳40,000",
    preferredPlatforms: "Instagram & YouTube",
    preferredCreatorTags: [
      "Health & wellness",
      "Nutrition",
      "Fitness lifestyle",
      "Female audience 18-34",
      "Dhaka-based reach",
      "Authentic storytelling",
    ],
    logoUrl: "",
    coverUrl: "",
    memberSince: "Jan 2024",
    sinceYear: 2024,
    dealsCompleted: 7,
    avgRating: 4.7,
    ratingCount: 7,
    campaignsPosted: 12,
    totalPaidEscrow: "৳4.2L",
    escrowDeals: 7,
    profileStrength: 75,
    updatedAt: "",
  },
  metrics: {
    liveCampaigns: 2,
    applicants: 47,
    spentTotal: "৳92K",
    unreadMessages: 3,
    activeDeals: 2,
    campaignsUsed: 4,
    campaignsLimit: 6,
    platformLiveCampaigns: 47,
    platformDealsClosed: 23,
    platformNewCreators: 31,
    platformAvgResponseTime: "<4 hrs",
  },
  savedCreators: ["lamia"],
  campaigns: [],
  announcements: [],
};

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeSponsorHomeState(existing = {}, update = {}) {
  const safeText = (value, max = 200) =>
    String(value || "")
      .trim()
      .slice(0, max);

  const safeArray = (value, fallback = []) =>
    Array.isArray(value) ? value.slice(0, 50) : cloneValue(fallback);

  const safeUrl = (value) => {
    const url = safeText(value, 250000);
    if (!url) return "";
    return /^https?:\/\//i.test(url) || /^data:image\//i.test(url) ? url : "";
  };

  const safeInt = (value, fallback = 0, min = 0, max = 999999) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, Math.round(num)));
  };

  const safeFloat = (value, fallback = 0, min = 0, max = 5) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, Number(num.toFixed(1))));
  };

  const mergedBrandProfile = {
    ...defaultSponsorHomeState.brandProfile,
    ...(existing.brandProfile || {}),
    ...(update.brandProfile || {}),
  };

  return {
    profile: {
      ...defaultSponsorHomeState.profile,
      ...(existing.profile || {}),
      ...(update.profile || {}),
      phone: safeText(update.profile?.phone || existing.profile?.phone, 24),
      displayName: safeText(
        update.profile?.displayName || existing.profile?.displayName,
        80,
      ),
      industry: safeText(
        update.profile?.industry || existing.profile?.industry,
        80,
      ),
      location: safeText(
        update.profile?.location || existing.profile?.location,
        80,
      ),
      plan: safeText(update.profile?.plan || existing.profile?.plan, 20),
      initials: safeText(
        update.profile?.initials || existing.profile?.initials,
        4,
      ),
      subtitle: safeText(
        update.profile?.subtitle || existing.profile?.subtitle,
        120,
      ),
    },
    metrics: {
      ...defaultSponsorHomeState.metrics,
      ...(existing.metrics || {}),
      ...(update.metrics || {}),
    },
    brandProfile: {
      ...mergedBrandProfile,
      brandName: safeText(mergedBrandProfile.brandName, 80),
      industry: safeText(mergedBrandProfile.industry, 80),
      location: safeText(mergedBrandProfile.location, 80),
      country: safeText(mergedBrandProfile.country, 80),
      tagline: safeText(mergedBrandProfile.tagline, 180),
      about: safeText(mergedBrandProfile.about, 3000),
      website: safeUrl(mergedBrandProfile.website),
      typicalBudget: safeText(mergedBrandProfile.typicalBudget, 80),
      preferredPlatforms: safeText(mergedBrandProfile.preferredPlatforms, 80),
      preferredCreatorTags: safeArray(
        (mergedBrandProfile.preferredCreatorTags || []).map((tag) =>
          safeText(tag, 40),
        ),
        defaultSponsorHomeState.brandProfile.preferredCreatorTags,
      ).filter(Boolean),
      logoUrl: safeUrl(mergedBrandProfile.logoUrl),
      coverUrl: safeUrl(mergedBrandProfile.coverUrl),
      memberSince: safeText(mergedBrandProfile.memberSince, 30),
      sinceYear: safeInt(mergedBrandProfile.sinceYear, 2024, 2000, 2100),
      dealsCompleted: safeInt(mergedBrandProfile.dealsCompleted, 0, 0, 9999),
      avgRating: safeFloat(mergedBrandProfile.avgRating, 0, 0, 5),
      ratingCount: safeInt(mergedBrandProfile.ratingCount, 0, 0, 9999),
      campaignsPosted: safeInt(mergedBrandProfile.campaignsPosted, 0, 0, 9999),
      totalPaidEscrow: safeText(mergedBrandProfile.totalPaidEscrow, 40),
      escrowDeals: safeInt(mergedBrandProfile.escrowDeals, 0, 0, 9999),
      profileStrength: safeInt(mergedBrandProfile.profileStrength, 0, 0, 100),
      updatedAt: safeText(mergedBrandProfile.updatedAt, 40),
    },
    savedCreators: safeArray(
      update.savedCreators || existing.savedCreators,
      defaultSponsorHomeState.savedCreators,
    ),
    campaigns: safeArray(update.campaigns || existing.campaigns),
    announcements: safeArray(update.announcements || existing.announcements),
  };
}

function ensureSponsorHomeCollection() {
  if (!sponsorHomeStatesCollection) {
    sponsorHomeStatesCollection = new InMemoryCollection("phone");
  }
}

async function loadSponsorHomeState(phone) {
  ensureSponsorHomeCollection();
  const record = await sponsorHomeStatesCollection.findOne({ phone });
  const merged = mergeSponsorHomeState(defaultSponsorHomeState, record || {});
  merged.profile.phone = phone;
  return merged;
}

function sanitizeSponsorProfileUpdate(payload = {}) {
  const cleanText = (value, max = 300) =>
    String(value || "")
      .trim()
      .slice(0, max);

  const safeUrl = (value) => {
    const url = cleanText(value, 250000);
    if (!url) return "";
    return /^https?:\/\//i.test(url) || /^data:image\//i.test(url) ? url : "";
  };

  const toInt = (value, fallback = 0, min = 0, max = 999999) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, Math.round(num)));
  };

  const toFloat = (value, fallback = 0, min = 0, max = 5) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, Number(num.toFixed(1))));
  };

  return {
    brandName: cleanText(payload.brandName, 80),
    industry: cleanText(payload.industry, 80),
    location: cleanText(payload.location, 80),
    country: cleanText(payload.country, 80),
    tagline: cleanText(payload.tagline, 180),
    about: cleanText(payload.about, 3000),
    website: safeUrl(payload.website),
    typicalBudget: cleanText(payload.typicalBudget, 80),
    preferredPlatforms: cleanText(payload.preferredPlatforms, 80),
    preferredCreatorTags: Array.isArray(payload.preferredCreatorTags)
      ? payload.preferredCreatorTags
          .map((item) => cleanText(item, 40))
          .filter(Boolean)
          .slice(0, 12)
      : cleanText(payload.preferredCreatorTags, 500)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12),
    logoUrl: safeUrl(payload.logoUrl),
    coverUrl: safeUrl(payload.coverUrl),
    memberSince: cleanText(payload.memberSince, 30),
    sinceYear: toInt(payload.sinceYear, 2024, 2000, 2100),
    dealsCompleted: toInt(payload.dealsCompleted, 0, 0, 9999),
    avgRating: toFloat(payload.avgRating, 0, 0, 5),
    ratingCount: toInt(payload.ratingCount, 0, 0, 9999),
    campaignsPosted: toInt(payload.campaignsPosted, 0, 0, 9999),
    totalPaidEscrow: cleanText(payload.totalPaidEscrow, 40),
    escrowDeals: toInt(payload.escrowDeals, 0, 0, 9999),
    profileStrength: toInt(payload.profileStrength, 0, 0, 100),
  };
}

function brandInitials(name) {
  const source = String(name || "").trim();
  if (!source) return "SP";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

const defaultDealStates = {
  dealA: {
    termsStatus: "proposed",
    termsAccepted: false,
    creatorSentTerms: true,
    sponsorPreview:
      "Terms proposed — ৳35,000 for 2 reels, 3 stories, YouTube short.",
    sponseePreview: "We accepted your application! Please send your terms.",
  },
  dealB: {
    dealRecordSponsorConfirmed: false,
    dealRecordSponseeConfirmed: false,
    sponsorPreview: "Deal record ready — your confirmation needed.",
    sponseePreview: "Deal record sent — please confirm to proceed.",
  },
  dealC: {
    escrowFunded: true,
    contentSubmitted: false,
    revisionRequested: false,
    sponsorPreview: "Terms accepted — please fund escrow to start.",
    sponseePreview: "Escrow funded ৳18,000 — you can start work now!",
  },
  dealD: {
    sponsorRated: false,
    sponseeRated: false,
    sponsorPreview: "Payment released. Rate creator to complete the deal.",
    sponseePreview: "Content approved · payment released. Please rate sponsor.",
  },
};

function cleanDealId(value) {
  const id = String(value || "")
    .trim()
    .slice(0, 64);
  return /^[a-zA-Z0-9_-]+$/.test(id) ? id : "";
}

function sanitizeDealPatch(payload = {}) {
  const toBool = (value) => value === true;
  const toText = (value, max = 260) =>
    String(value || "")
      .trim()
      .slice(0, max);
  const toRating = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return Math.max(1, Math.min(5, Math.round(num)));
  };

  const patch = {};
  if (payload.termsStatus !== undefined) {
    patch.termsStatus = toText(payload.termsStatus, 40);
  }
  [
    "termsAccepted",
    "creatorSentTerms",
    "dealRecordSponsorConfirmed",
    "dealRecordSponseeConfirmed",
    "escrowFunded",
    "contentSubmitted",
    "revisionRequested",
    "sponsorRated",
    "sponseeRated",
  ].forEach((key) => {
    if (payload[key] !== undefined) {
      patch[key] = toBool(payload[key]);
    }
  });

  [
    "sponsorPreview",
    "sponseePreview",
    "lastSponsorMessage",
    "lastSponseeMessage",
  ].forEach((key) => {
    if (payload[key] !== undefined) {
      patch[key] = toText(payload[key], 400);
    }
  });

  if (payload.sponsorRating !== undefined) {
    const rating = toRating(payload.sponsorRating);
    if (rating !== null) patch.sponsorRating = rating;
  }
  if (payload.sponseeRating !== undefined) {
    const rating = toRating(payload.sponseeRating);
    if (rating !== null) patch.sponseeRating = rating;
  }

  return patch;
}

function sanitizeMessagePayload(payload = {}) {
  const senderRole = String(payload.senderRole || "")
    .trim()
    .toLowerCase();
  const text = String(payload.text || "")
    .trim()
    .slice(0, 2000);
  if (!text) return null;
  if (!["sponsor", "sponsee", "system"].includes(senderRole)) return null;
  return { senderRole, text };
}

async function ensureDealDoc(dealId) {
  const existing = await chatDealsCollection.findOne({ dealId });
  if (existing) return existing;

  const nowIso = new Date().toISOString();
  const seed = {
    dealId,
    state: {
      ...(defaultDealStates[dealId] || {}),
      lastUpdatedAt: Date.now(),
    },
    createdAt: nowIso,
  };

  await chatDealsCollection.updateOne(
    { dealId },
    { $setOnInsert: seed, $set: { updatedAt: nowIso } },
    { upsert: true },
  );

  return (await chatDealsCollection.findOne({ dealId })) || seed;
}

async function getMessagesByDeal(dealId, after, limit) {
  if (chatMessagesCollection instanceof InMemoryMessageCollection) {
    return chatMessagesCollection.findByDeal(dealId, { after, limit });
  }

  const query = { dealId };
  if (after) {
    query.createdAt = { $gt: String(after) };
  }

  const rows = await chatMessagesCollection
    .find(query)
    .sort({ createdAt: 1 })
    .limit(Math.max(1, Math.min(Number(limit || 50), 200)))
    .toArray();

  return rows;
}

app.get("/api/chat/deals", async (req, res) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => cleanDealId(id))
      .filter(Boolean)
      .slice(0, 20);

    if (!ids.length) {
      return res
        .status(400)
        .json({ error: "At least one deal id is required" });
    }

    const result = {};
    for (const dealId of ids) {
      const doc = await ensureDealDoc(dealId);
      result[dealId] = doc.state || {};
    }

    return res.json({ deals: result });
  } catch (err) {
    console.error("Chat deals GET error:", err.message);
    return res.status(500).json({ error: "Failed to load chat deals" });
  }
});

app.patch("/api/chat/deals/:dealId/state", async (req, res) => {
  try {
    const dealId = cleanDealId(req.params.dealId);
    if (!dealId) {
      return res.status(400).json({ error: "Valid deal id is required" });
    }

    const patch = sanitizeDealPatch(req.body || {});
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: "No valid state fields supplied" });
    }

    const doc = await ensureDealDoc(dealId);
    const nextState = {
      ...(doc.state || {}),
      ...patch,
      lastUpdatedAt: Date.now(),
    };

    await chatDealsCollection.updateOne(
      { dealId },
      {
        $set: {
          state: nextState,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    return res.json({ ok: true, state: nextState });
  } catch (err) {
    console.error("Chat deal PATCH error:", err.message);
    return res.status(500).json({ error: "Failed to update deal state" });
  }
});

app.get("/api/chat/deals/:dealId/messages", async (req, res) => {
  try {
    const dealId = cleanDealId(req.params.dealId);
    if (!dealId) {
      return res.status(400).json({ error: "Valid deal id is required" });
    }

    const after = req.query.after ? String(req.query.after) : "";
    const limit = Number(req.query.limit || 50);
    const messages = await getMessagesByDeal(dealId, after, limit);

    return res.json({ messages });
  } catch (err) {
    console.error("Chat messages GET error:", err.message);
    return res.status(500).json({ error: "Failed to load messages" });
  }
});

app.post("/api/chat/deals/:dealId/messages", async (req, res) => {
  try {
    const dealId = cleanDealId(req.params.dealId);
    if (!dealId) {
      return res.status(400).json({ error: "Valid deal id is required" });
    }

    const clean = sanitizeMessagePayload(req.body || {});
    if (!clean) {
      return res
        .status(400)
        .json({ error: "Valid senderRole and text are required" });
    }

    await ensureDealDoc(dealId);

    const now = new Date().toISOString();
    const message = {
      dealId,
      senderRole: clean.senderRole,
      text: clean.text,
      createdAt: now,
    };

    const insert = await chatMessagesCollection.insertOne(message);
    const messageId = insert.insertedId ? String(insert.insertedId) : now;

    const doc = await ensureDealDoc(dealId);
    const nextState = {
      ...(doc.state || {}),
      lastUpdatedAt: Date.now(),
      lastMessageAt: now,
      ...(clean.senderRole === "sponsor"
        ? {
            sponsorPreview: clean.text,
            sponseePreview: clean.text,
            lastSponsorMessage: clean.text,
          }
        : clean.senderRole === "sponsee"
          ? {
              sponsorPreview: clean.text,
              sponseePreview: clean.text,
              lastSponseeMessage: clean.text,
            }
          : {}),
    };

    await chatDealsCollection.updateOne(
      { dealId },
      {
        $set: {
          state: nextState,
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    return res.json({ ok: true, message: { ...message, _id: messageId } });
  } catch (err) {
    console.error("Chat message POST error:", err.message);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/sponsor/home/:phone", async (req, res) => {
  try {
    const phone = String(req.params.phone || "").trim();
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    const state = await loadSponsorHomeState(phone);
    return res.json({ state });
  } catch (err) {
    console.error("Sponsor home GET error:", err.message);
    return res.status(500).json({ error: "Failed to load sponsor state" });
  }
});

app.put("/api/sponsor/home/:phone", async (req, res) => {
  try {
    const phone = String(req.params.phone || "").trim();
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const update = req.body || {};
    const existing = await loadSponsorHomeState(phone);
    const merged = mergeSponsorHomeState(existing, update);

    await sponsorHomeStatesCollection.updateOne(
      { phone },
      { $set: merged },
      { upsert: true },
    );

    const state = await loadSponsorHomeState(phone);
    return res.json({ ok: true, state });
  } catch (err) {
    console.error("Sponsor home PUT error:", err.message);
    return res.status(500).json({ error: "Failed to save sponsor state" });
  }
});

app.get("/api/sponsor/profile/:phone", async (req, res) => {
  try {
    const phone = String(req.params.phone || "").trim();
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    const state = await loadSponsorHomeState(phone);
    return res.json({ profile: state.brandProfile || {} });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load sponsor profile" });
  }
});

app.put("/api/sponsor/profile/:phone", async (req, res) => {
  try {
    const ownerPhone = String(req.headers["x-user-phone"] || "").trim();
    const profilePhone = String(req.params.phone || "").trim();
    if (!profilePhone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (ownerPhone && ownerPhone !== profilePhone) {
      return res.status(403).json({ error: "Only profile owner can edit" });
    }

    const existing = await loadSponsorHomeState(profilePhone);
    const cleaned = sanitizeSponsorProfileUpdate(req.body || {});
    const nextBrandProfile = {
      ...(existing.brandProfile || {}),
      ...cleaned,
      updatedAt: new Date().toISOString(),
    };

    const locationText = [nextBrandProfile.location, nextBrandProfile.country]
      .filter(Boolean)
      .join(", ");
    const homeProfilePatch = {
      phone: profilePhone,
      displayName: nextBrandProfile.brandName || existing.profile?.displayName,
      industry: nextBrandProfile.industry || existing.profile?.industry,
      location: nextBrandProfile.location || existing.profile?.location,
      initials: brandInitials(nextBrandProfile.brandName),
      subtitle: [nextBrandProfile.industry, nextBrandProfile.location]
        .filter(Boolean)
        .join(" · "),
      locationText,
    };

    const merged = mergeSponsorHomeState(existing, {
      profile: homeProfilePatch,
      brandProfile: nextBrandProfile,
    });

    await sponsorHomeStatesCollection.updateOne(
      { phone: profilePhone },
      { $set: merged },
      { upsert: true },
    );

    return res.json({ ok: true, profile: merged.brandProfile });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update sponsor profile" });
  }
});

app.put("/api/payment-verification/:id", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    };

    await paymentCollection.updateOne(
      { id: req.params.id },
      { $set: payload },
      { upsert: true },
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save record" });
  }
});

app.post("/api/sponsee/signup", async (req, res) => {
  try {
    const {
      phone,
      displayName,
      category,
      platform,
      password,
      handle,
      followers,
      location,
      language,
      bio,
      rateFrom,
      rateTo,
    } = req.body;

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ error: "Valid phone is required" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const now = new Date().toISOString();
    const user = {
      phone: phone.trim(),
      displayName: (displayName || "").trim(),
      category: category || null,
      platform: platform || null,
      password,
      profile: {
        handle: (handle || "").trim(),
        followers: (followers || "").trim(),
        location: location || "",
        language: language || "",
        bio: (bio || "").trim(),
        rateFrom: (rateFrom || "").trim(),
        rateTo: (rateTo || "").trim(),
      },
      updatedAt: now,
    };

    await sponseeUsersCollection.updateOne(
      { phone: user.phone },
      { $set: user, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    return res.json({ ok: true, userId: user.phone });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save signup" });
  }
});

app.get("/api/sponsee/signup/:phone", async (req, res) => {
  try {
    const user = await sponseeUsersCollection.findOne({
      phone: req.params.phone,
    });
    if (!user) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch signup" });
  }
});

app.get("/api/sponsee/bootstrap/:phone", async (req, res) => {
  try {
    const phone = req.params.phone;
    const user = await sponseeUsersCollection.findOne({ phone });
    const snapshot = buildSponseeSnapshot(user);
    return res.json(snapshot);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load bootstrap data" });
  }
});

app.get("/api/sponsee/campaigns/:phone", async (req, res) => {
  try {
    const user = await sponseeUsersCollection.findOne({
      phone: req.params.phone,
    });
    const snapshot = buildSponseeSnapshot(user);
    return res.json({ campaigns: snapshot.campaigns });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load campaigns" });
  }
});

app.get("/api/sponsee/profile/:phone", async (req, res) => {
  try {
    const user = await sponseeUsersCollection.findOne({
      phone: req.params.phone,
    });
    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const snapshot = buildSponseeSnapshot(user);
    return res.json({ profile: snapshot.user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

app.put("/api/sponsee/profile/:phone", async (req, res) => {
  try {
    const ownerPhone = String(req.headers["x-user-phone"] || "").trim();
    const profilePhone = String(req.params.phone || "").trim();
    if (!ownerPhone || ownerPhone !== profilePhone) {
      return res.status(403).json({ error: "Only profile owner can edit" });
    }

    const existing = await sponseeUsersCollection.findOne({
      phone: profilePhone,
    });
    if (!existing) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const cleaned = sanitizeProfileUpdate(req.body || {});
    const mergedProfile = {
      ...(existing.profile || {}),
      location: cleaned.location || existing.profile?.location || "",
      profilePhotoUrl: cleaned.profilePhotoUrl,
      coverPhotoUrl: cleaned.coverPhotoUrl,
      about: cleaned.about,
      bio: cleaned.about || existing.profile?.bio || "",
      nichePrimary: cleaned.nichePrimary,
      nicheSecondary: cleaned.nicheSecondary,
      rateFrom: cleaned.rateFrom || existing.profile?.rateFrom || "",
      rateTo: cleaned.rateTo || existing.profile?.rateTo || "",
      sponsorshipRates: {
        ...(existing.profile?.sponsorshipRates || {}),
        ...cleaned.sponsorshipRates,
      },
      sponsorshipRateEntries:
        cleaned.sponsorshipRateEntries.length > 0
          ? cleaned.sponsorshipRateEntries
          : existing.profile?.sponsorshipRateEntries || [],
      collaboration: {
        ...(existing.profile?.collaboration || {}),
        ...cleaned.collaboration,
      },
      platformPreference:
        cleaned.platformPreference ||
        existing.profile?.platformPreference ||
        existing.platform ||
        "",
      platformPresence: {
        ...(existing.profile?.platformPresence || {}),
        instagram: {
          ...(existing.profile?.platformPresence?.instagram || {}),
          ...(cleaned.platformPresence?.instagram || {}),
        },
        tiktok: {
          ...(existing.profile?.platformPresence?.tiktok || {}),
          ...(cleaned.platformPresence?.tiktok || {}),
        },
      },
      audienceOverview:
        cleaned.audienceOverview || existing.profile?.audienceOverview || "",
      audienceDetails: {
        age: {
          ...(existing.profile?.audienceDetails?.age || {}),
          ...(cleaned.audienceDetails?.age || {}),
        },
        gender: {
          ...(existing.profile?.audienceDetails?.gender || {}),
          ...(cleaned.audienceDetails?.gender || {}),
        },
        geography:
          cleaned.audienceDetails?.geography?.length > 0
            ? cleaned.audienceDetails.geography
            : existing.profile?.audienceDetails?.geography || [],
      },
    };

    const updatedUser = {
      ...existing,
      displayName: cleaned.displayName || existing.displayName,
      platform: cleaned.platformPreference || existing.platform || "Instagram",
      profile: mergedProfile,
      updatedAt: new Date().toISOString(),
    };

    await sponseeUsersCollection.updateOne(
      { phone: profilePhone },
      { $set: updatedUser },
      { upsert: false },
    );

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

async function start() {
  try {
    // Long-running API server: keep a moderate warm pool and fail fast on topology issues.
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 5 * 60 * 1000,
      connectTimeoutMS: 10 * 1000,
      socketTimeoutMS: 30 * 1000,
      serverSelectionTimeoutMS: 5 * 1000,
    });
    await client.connect();
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);

    const db = client.db(MONGODB_DB_NAME);
    paymentCollection = db.collection("payment_verifications");
    sponseeUsersCollection = db.collection("sponsee_users");
    sponsorHomeStatesCollection = db.collection("sponsor_home_states");
    chatDealsCollection = db.collection("chat_deals");
    chatMessagesCollection = db.collection("chat_messages");

    await paymentCollection.createIndex({ id: 1 }, { unique: true });
    await sponseeUsersCollection.createIndex({ phone: 1 }, { unique: true });
    await sponsorHomeStatesCollection.createIndex(
      { phone: 1 },
      { unique: true },
    );
    await chatDealsCollection.createIndex({ dealId: 1 }, { unique: true });
    await chatMessagesCollection.createIndex({ dealId: 1, createdAt: 1 });
  } catch (err) {
    console.warn(
      "MongoDB unavailable. Starting with in-memory storage fallback.",
    );
    console.warn("Reason:", err.message);
    paymentCollection = new InMemoryCollection("id");
    sponseeUsersCollection = new InMemoryCollection("phone");
    sponsorHomeStatesCollection = new InMemoryCollection("phone");
    chatDealsCollection = new InMemoryCollection("dealId");
    chatMessagesCollection = new InMemoryMessageCollection();
  }

  app.listen(PORT, () => {
    console.log(
      `MongoDB API + static server running on http://localhost:${PORT}`,
    );
  });
}

start().catch((err) => {
  console.error("Failed to start API server", err);
  process.exit(1);
});
