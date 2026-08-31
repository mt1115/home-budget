import { NextRequest, NextResponse } from "next/server";

type ProductInfo = {
  name?: string;
  maker?: string;
  model?: string;
  price?: number;
  image?: string;
  shop?: string;
  url?: string;
  memo?: string;
};

const makerHints = ["Panasonic", "Hitachi", "Toshiba", "Sharp", "Mitsubishi", "Sony", "Nitori", "Muji", "KEYUCA", "Yamazen", "Iris Ohyama"];

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json() as { url?: string };
    if (!url || !/^https?:\/\//.test(url)) return NextResponse.json({ error: "URLを入力してください" }, { status: 400 });

    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 HomeBudgetBot/1.0" }, next: { revalidate: 0 } });
    if (!response.ok) return NextResponse.json({ error: "URLを読み取れませんでした" }, { status: 400 });

    const html = await response.text();
    return NextResponse.json({ product: extractProduct(html, url) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "読み取りに失敗しました" }, { status: 500 });
  }
}

function extractProduct(html: string, url: string): ProductInfo {
  const jsonLd = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((match) => safeJson(match[1])).flat();
  const product = jsonLd.find((item) => item && typeof item === "object" && [item["@type"]].flat().includes("Product"));
  const name = stringValue(product?.name) || meta(html, "og:title") || title(html);
  const maker = stringValue(product?.brand?.name) || stringValue(product?.brand) || makerHints.find((hint) => name?.toLowerCase().includes(hint.toLowerCase())) || "";
  const priceText = stringValue(product?.offers?.price) || meta(html, "product:price:amount") || firstMatch(html, /(?:￥|¥|&yen;|税込)?\s*([0-9][0-9,]{3,})\s*円?/);
  const image = stringValue([product?.image].flat()[0]) || meta(html, "og:image") || "";
  const shop = meta(html, "og:site_name") || host(url);
  return { name: clean(name), maker: clean(maker), model: guessModel(`${name ?? ""} ${html.slice(0, 3000)}`), price: toPrice(priceText), image, shop, url, memo: "URLから自動入力" };
}

function safeJson(text: string) {
  try {
    const parsed = JSON.parse(text.replace(/&quot;/g, '"'));
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch { return []; }
}

function meta(html: string, key: string) {
  return firstMatch(html, new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")) || firstMatch(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]*>`, "i"));
}

function title(html: string) { return firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i); }
function firstMatch(text: string, pattern: RegExp) { return text.match(pattern)?.[1]; }
function stringValue(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value) : ""; }
function clean(value?: string) { return value?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() ?? ""; }
function toPrice(value?: string) { const parsed = Number(value?.replace(/[^0-9]/g, "")); return Number.isFinite(parsed) ? parsed : undefined; }
function host(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function guessModel(text: string) { return text.match(/\b[A-Z]{1,5}[-_ ]?[A-Z0-9]{2,}(?:[-_ ][A-Z0-9]{2,})?\b/)?.[0]?.replace(/\s+/g, "-") ?? ""; }

