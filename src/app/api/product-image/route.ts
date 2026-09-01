import { NextRequest, NextResponse } from "next/server";

type ProductInfo = { name?: string; maker?: string; model?: string; price?: number; image?: string; shop?: string; url?: string; memo?: string };
type DifyOutput = { manufacturer?: string; maker?: string; model?: string; name?: string; price?: number | string; url?: string; image?: string; shop?: string; memo?: string; [key: string]: unknown };

const DIFY_BASE_URL = process.env.DIFY_BASE_URL ?? "https://api.dify.ai/v1";
const DIFY_IMAGE_VARIABLE = process.env.DIFY_IMAGE_VARIABLE ?? "image";
const DIFY_USER = "home-budget";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return NextResponse.json({ error: "画像を選択してください" }, { status: 400 });
    if (!process.env.DIFY_API_KEY) return NextResponse.json({ error: "画像認識にはDIFY_API_KEYが必要です" }, { status: 400 });

    const uploadId = await uploadDifyFile(file);
    const output = await runDifyWorkflow(uploadId);
    const product = normalizeDifyOutput(output);
    const query = buildSearchQuery(product);
    const foundUrl = product.url || (query ? await searchProductUrl(query, product) : "");
    if (foundUrl) {
      const siteProduct = await extractProductFromUrl(foundUrl);
      Object.assign(product, mergeProductInfo(product, siteProduct));
      product.url = foundUrl;
      product.shop = product.shop || host(foundUrl);
    } else if (query) {
      product.url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      product.shop = "Google検索";
    }
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "画像認識に失敗しました" }, { status: 500 });
  }
}

async function uploadDifyFile(file: File) {
  const uploadForm = new FormData();
  uploadForm.append("file", file, "product-image.jpg");
  uploadForm.append("user", DIFY_USER);

  const response = await fetch(`${DIFY_BASE_URL}/files/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DIFY_API_KEY}` },
    body: uploadForm,
  });
  const data = await response.json();
  if (!response.ok || !data.id) throw new Error(data.message ? `Difyアップロード失敗: ${data.message}` : "Difyへの画像アップロードに失敗しました");
  return data.id as string;
}

async function runDifyWorkflow(uploadFileId: string): Promise<DifyOutput> {
  const response = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DIFY_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      inputs: {
        [DIFY_IMAGE_VARIABLE]: {
          transfer_method: "local_file",
          upload_file_id: uploadFileId,
          type: "image",
        },
      },
      response_mode: "blocking",
      user: DIFY_USER,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "Dify workflowの実行に失敗しました");
  return (data.data?.outputs ?? data.outputs ?? {}) as DifyOutput;
}

function normalizeDifyOutput(output: DifyOutput): ProductInfo {
  const maker = stringValue(output.manufacturer) || stringValue(output.maker);
  const model = stringValue(output.model);
  const name = stringValue(output.name) || [maker, model].filter(Boolean).join(" ");
  return {
    maker,
    model,
    name,
    price: toPrice(output.price),
    url: stringValue(output.url),
    image: stringValue(output.image),
    shop: stringValue(output.shop),
    memo: stringValue(output.memo),
  };
}

async function searchProductUrl(query: string, product: ProductInfo) {
  const candidates = await Promise.all([
    searchDuckDuckGo(query),
    searchDuckDuckGo(`${query} ヨドバシ ビックカメラ 価格.com`),
    searchBing(query),
  ]);
  return candidates.flat().map((url) => normalizeCandidateUrl(url)).filter(Boolean).filter((url, index, urls) => urls.indexOf(url) === index).sort((a, b) => scoreCandidate(b, product) - scoreCandidate(a, product))[0] ?? "";
}

async function searchDuckDuckGo(query: string) {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
    if (!response.ok) return [];
    const html = await response.text();
    return Array.from(html.matchAll(/<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/gi)).map((match) => decodeSearchHref(match[1])).filter(Boolean);
  } catch { return []; }
}

async function searchBing(query: string) {
  try {
    const response = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
    if (!response.ok) return [];
    const html = await response.text();
    return Array.from(html.matchAll(/<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["']/gi)).map((match) => decodeSearchHref(match[1])).filter(Boolean);
  } catch { return []; }
}

function scoreCandidate(url: string, product: ProductInfo) {
  const normalizedUrl = normalizeForCompare(url);
  const model = normalizeForCompare(product.model ?? "");
  const maker = normalizeForCompare(product.maker ?? "");
  let score = 0;
  if (model && normalizedUrl.includes(model)) score += 100;
  if (maker && normalizedUrl.includes(maker)) score += 20;
  if (/yodobashi|biccamera|ksdenki|edion|nojima|joshin|yamada|rakuten|amazon|kakaku|mitsubishielectric/i.test(url)) score += 15;
  if (/search|itemlist|category|ranking/i.test(url)) score -= 10;
  if (/duckduckgo|google\.com\/search|bing\.com\/search/i.test(url)) score -= 100;
  return score;
}

function normalizeCandidateUrl(url: string) {
  if (!/^https?:\/\//.test(url)) return "";
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch { return ""; }
}

function normalizeForCompare(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9ぁ-んァ-ン一-龥]/g, "");
}

function buildSearchQuery(product: ProductInfo) {
  const model = product.model?.trim() ?? "";
  const maker = product.maker?.trim() ?? "";
  return [maker, model, model ? "価格" : "", model ? "商品" : product.name].filter(Boolean).join(" ");
}

function decodeSearchHref(href: string) {
  const cleaned = href.replace(/&amp;/g, "&");
  try {
    if (cleaned.includes("uddg=")) return new URL(cleaned, "https://duckduckgo.com").searchParams.get("uddg") ?? "";
    if (cleaned.startsWith("//")) return `https:${cleaned}`;
    return cleaned;
  } catch { return ""; }
}
async function extractProductFromUrl(url: string): Promise<ProductInfo> {
  try {
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 HomeBudgetBot/1.0" }, next: { revalidate: 0 } });
    if (!response.ok) return {};
    return extractProduct(await response.text(), url);
  } catch { return {}; }
}

function extractProduct(html: string, url: string): ProductInfo {
  const jsonLd = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).map((match) => safeJson(match[1])).flat();
  const product = jsonLd.find((item) => item && typeof item === "object" && [item["@type"]].flat().includes("Product"));
  const name = stringValue(product?.name) || meta(html, "og:title") || title(html);
  const maker = stringValue(product?.brand?.name) || stringValue(product?.brand);
  const priceText = stringValue(product?.offers?.price) || meta(html, "product:price:amount") || firstMatch(html, /(?:￥|¥|&yen;|税込)?\s*([0-9][0-9,]{3,})\s*円?/);
  const image = stringValue([product?.image].flat()[0]) || meta(html, "og:image") || "";
  const shop = meta(html, "og:site_name") || host(url);
  return { name: clean(name), maker: clean(maker), model: guessModel(`${name ?? ""} ${html.slice(0, 3000)}`), price: toPrice(priceText), image, shop, url };
}

function mergeProductInfo(base: ProductInfo, site: ProductInfo): ProductInfo {
  return {
    name: site.name || base.name,
    maker: base.maker || site.maker,
    model: base.model || site.model,
    price: site.price ?? base.price,
    image: site.image || base.image,
    shop: site.shop || base.shop,
    url: site.url || base.url,
    memo: base.memo,
  };
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
function clean(value?: string) { return value?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() ?? ""; }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function guessModel(text: string) { return text.match(/\b[A-Z]{1,5}[-_ ]?[A-Z0-9]{2,}(?:[-_ ][A-Z0-9]{2,})?\b/)?.[0]?.replace(/\s+/g, "-") ?? ""; }
function stringValue(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; }
function toPrice(value: unknown) { const parsed = Number(stringValue(value).replace(/[^0-9]/g, "")); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; }
function host(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } }





