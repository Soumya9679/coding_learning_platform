import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pulsepy.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/community`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/paths`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/duels`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/ide`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/gamified`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];
}
