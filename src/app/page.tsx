"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Armchair, BarChart3, ChevronDown, ChevronLeft, Edit3, Heart, HomeIcon, ImagePlus, MoreHorizontal, Plus, Refrigerator, Search, Sparkles, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type Tab = "dashboard" | "appliances" | "furniture";
type CategoryType = "appliance" | "furniture";
type View = "category" | "items" | "detail" | "selected";
type MenuMode = "root" | "budget";

type Category = { id: string; type: CategoryType; name: string; budgetAmount: number; tags: string[] };
type ProductDraft = Omit<Product, "id" | "color">;
type Product = { id: string; categoryId: string; name: string; maker: string; model: string; price: number; url: string; shop: string; image: string; tags: string[]; memo: string; selected: boolean; favorite: boolean; color: string };
type SettingsRow = { household_id: string; total_budget: number };
type CategoryRow = { id: string; household_id: string; type: CategoryType; name: string; budget_amount: number | null; sort_order: number | null };
type ItemRow = { id: string; household_id: string; category_id: string; name: string; maker: string | null; model_number: string | null; price: number | null; url: string | null; image_url: string | null; shop_name: string | null; memo: string | null; status: "candidate" | "selected" | "on_hold" | "purchased" };
type TagRow = { id: string; name: string };
type ItemTagRow = { item_id: string; tag_id: string };

const label = {
  dashboard: "ダッシュボード",
  appliances: "家電",
  furniture: "家具",
  budget: "総予算",
  remaining: "残り",
  selected: "選択中",
  selectedList: "選択中の家電・家具",
  budgetManage: "予算管理",
  save: "保存",
  cancel: "キャンセル",
  searchPlaceholder: "キーワードで検索",
  price: "価格",
  maker: "メーカー",
  model: "型番",
  shop: "店舗",
  memo: "メモ",
  productName: "商品名",
  imageUrl: "画像URL",
  tagCsv: "タグ",
  addTag: "+新しいタグ",
  newTag: "新しいタグ",
  unnamed: "名称未設定",
  editProduct: "商品を編集",
  markSelected: "選択中にする",
  fromPhoto: "画像から登録",
  fromUrl: "URLから登録",
  manual: "手入力で追加",
  edit: "編集",
  noItems: "該当なし",
  loginMissing: "ログイン未設定",
  login: "ログイン",
  logout: "ログアウト",
};

const colors = ["#43a047", "#a7c957", "#f2cc4d", "#ff9f1c", "#2ec4b6", "#8bc34a"];
const formatter = new Intl.NumberFormat("ja-JP");
const yen = (value: number) => `${formatter.format(value)}円`;

const initialCategories: Category[] = [
  { id: "fridge", type: "appliance", name: "冷蔵庫", budgetAmount: 180000, tags: ["400L", "幅60cm", "省エネ"] },
  { id: "washer", type: "appliance", name: "洗濯機", budgetAmount: 128000, tags: ["乾燥", "省エネ"] },
  { id: "aircon", type: "appliance", name: "エアコン", budgetAmount: 98000, tags: ["10畳", "自動掃除"] },
  { id: "microwave", type: "appliance", name: "電子レンジ", budgetAmount: 42000, tags: ["オーブン"] },
  { id: "bed", type: "furniture", name: "ベッド", budgetAmount: 92000, tags: ["収納", "低め"] },
  { id: "sofa", type: "furniture", name: "ソファ", budgetAmount: 78000, tags: ["2人掛け"] },
  { id: "dining", type: "furniture", name: "ダイニング", budgetAmount: 68000, tags: ["木目"] },
  { id: "curtain", type: "furniture", name: "カーテン", budgetAmount: 36000, tags: ["遮光"] },
];

const initialProducts: Product[] = [
  { id: "p1", categoryId: "fridge", name: "スリム冷蔵庫 406L", maker: "Hitachi", model: "R-HWS47", price: 180000, url: "https://example.com/fridge", shop: "量販店", image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&auto=format&fit=crop", tags: ["400L", "幅60cm", "省エネ"], memo: "幅が合う", selected: true, favorite: true, color: colors[0] },
  { id: "p2", categoryId: "fridge", name: "真ん中野菜室 450L", maker: "Panasonic", model: "NR-F45", price: 168000, url: "https://example.com/fridge2", shop: "Web", image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&auto=format&fit=crop", tags: ["450L", "野菜室"], memo: "色が良い", selected: false, favorite: false, color: colors[1] },
  { id: "p3", categoryId: "washer", name: "ドラム式洗濯乾燥機", maker: "Toshiba", model: "TW-127", price: 128000, url: "https://example.com/washer", shop: "量販店", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&auto=format&fit=crop", tags: ["乾燥", "省エネ"], memo: "乾燥重視", selected: true, favorite: true, color: colors[1] },
  { id: "p4", categoryId: "bed", name: "収納付きベッド", maker: "Nitori", model: "BD-LOW", price: 92000, url: "https://example.com/bed", shop: "Nitori", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300&auto=format&fit=crop", tags: ["収納", "低め"], memo: "寝室に合う", selected: true, favorite: false, color: colors[2] },
  { id: "p5", categoryId: "sofa", name: "2人掛けソファ", maker: "Muji", model: "SF-2", price: 78000, url: "https://example.com/sofa", shop: "Muji", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop", tags: ["2人掛け"], memo: "座り心地が良い", selected: true, favorite: true, color: colors[3] },
  { id: "p6", categoryId: "curtain", name: "遮光カーテン", maker: "KEYUCA", model: "CT-BK", price: 36000, url: "https://example.com/curtain", shop: "KEYUCA", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop", tags: ["遮光"], memo: "リビング用", selected: true, favorite: false, color: colors[4] },
];

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [view, setView] = useState<View>("category");
  const [budget, setBudget] = useState(800000);
  const [draftBudget, setDraftBudget] = useState("800000");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<MenuMode>("root");
  const [addOpen, setAddOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [householdId, setHouseholdId] = useState("");
  const [dbError, setDbError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!supabase) return;
      const [{ data: settings, error: settingsError }, { data: categoryRows, error: categoryError }, { data: itemRows, error: itemError }, { data: tagRows, error: tagError }, { data: itemTagRows, error: itemTagError }] = await Promise.all([
        supabase.from("settings").select("household_id,total_budget").limit(1).maybeSingle<SettingsRow>(),
        supabase.from("categories").select("id,household_id,type,name,budget_amount,sort_order").order("sort_order", { ascending: true }).returns<CategoryRow[]>(),
        supabase.from("items").select("id,household_id,category_id,name,maker,model_number,price,url,image_url,shop_name,memo,status").returns<ItemRow[]>(),
        supabase.from("tags").select("id,name").returns<TagRow[]>(),
        supabase.from("item_tags").select("item_id,tag_id").returns<ItemTagRow[]>(),
      ]);
      if (ignore) return;
      if (settingsError) { setDbError("Supabase settingsが読み取れません"); return; }
      if (categoryError || itemError || tagError || itemTagError) { setDbError("Supabaseデータの読み取りに失敗しました"); return; }
      const nextHouseholdId = settings?.household_id ?? categoryRows?.[0]?.household_id ?? itemRows?.[0]?.household_id ?? "";
      setHouseholdId(nextHouseholdId);
      if (settings?.total_budget) { setBudget(settings.total_budget); setDraftBudget(String(settings.total_budget)); }
      if (categoryRows?.length) {
        setCategories(categoryRows.map((c) => ({ id: c.id, type: c.type, name: c.name, budgetAmount: c.budget_amount ?? 0, tags: [] })));
        const tagNameById = new Map((tagRows ?? []).map((tag) => [tag.id, tag.name]));
        const tagsByItem = new Map<string, string[]>();
        (itemTagRows ?? []).forEach((row) => { const tag = tagNameById.get(row.tag_id); if (tag) tagsByItem.set(row.item_id, [...(tagsByItem.get(row.item_id) ?? []), tag]); });
        setProducts((itemRows ?? []).map((item, index) => ({ id: item.id, categoryId: item.category_id, name: item.name, maker: item.maker ?? "", model: item.model_number ?? "", price: item.price ?? 0, url: item.url ?? "", shop: item.shop_name ?? "", image: item.image_url ?? "", tags: tagsByItem.get(item.id) ?? [], memo: item.memo ?? "", selected: item.status === "selected", favorite: item.status === "selected", color: colors[index % colors.length] })));
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authReady && !session) router.replace("/login");
  }, [authReady, router, session]);

  const selectedProducts = products.filter((product) => product.selected);
  const selectedTotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
  const remaining = budget - selectedTotal;
  const currentType: CategoryType = tab === "furniture" ? "furniture" : "appliance";
  const activeCategories = categories.filter((category) => category.type === currentType);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? activeCategories[0];
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? selectedProducts[0];
  const visibleProducts = products.filter((product) => product.categoryId === selectedCategory?.id).filter((product) => matchSearch(product, query, minPrice, maxPrice));

  function closeOverlays() { setMenuOpen(false); setAddOpen(false); }
  function switchTab(next: Tab) { setTab(next); setView("category"); setSearchOpen(false); setSelectedCategoryId(null); closeOverlays(); }
  async function saveBudget() {
    const next = Number(draftBudget.replace(/,/g, ""));
    if (!Number.isNaN(next) && next > 0) {
      setBudget(next);
      setDraftBudget(String(next));
      if (supabase && householdId) await supabase.from("settings").update({ total_budget: next, updated_at: new Date().toISOString() }).eq("household_id", householdId);
    }
    setMenuMode("root");
    setMenuOpen(false);
  }

  async function toggleFavorite(id: string) {
    const target = products.find((item) => item.id === id);
    if (!target) return;
    const selected = !target.selected;
    setProducts((items) => items.map((item) => item.id === id ? { ...item, selected, favorite: selected } : item));
    if (supabase) {
      const { error } = await supabase.from("items").update({ status: selected ? "selected" : "candidate", updated_at: new Date().toISOString() }).eq("id", id);
      if (error) setDbError(`DB保存に失敗しました: ${error.message}`);
    }
  }

  async function saveProduct(draft: ProductDraft) {
    const nextId = editingProduct?.id ?? crypto.randomUUID();
    const nextProduct = { ...draft, id: nextId, color: editingProduct?.color ?? colors[products.length % colors.length] };
    if (supabase && householdId) {
      const payload = { id: nextId, household_id: householdId, category_id: draft.categoryId, name: draft.name, maker: draft.maker, model_number: draft.model, price: draft.price, url: draft.url, image_url: draft.image, shop_name: draft.shop, memo: draft.memo, status: draft.selected ? "selected" : "candidate", updated_at: new Date().toISOString() };
      const result = editingProduct ? await supabase.from("items").update(payload).eq("id", nextId) : await supabase.from("items").insert(payload);
      if (result.error) { setDbError(`DB保存に失敗しました: ${result.error.message}`); return; }
      const tagError = await saveItemTags(nextId, householdId, draft.tags);
      if (tagError) { setDbError(`タグ保存に失敗しました: ${tagError}`); return; }
    }
    setProducts((items) => editingProduct ? items.map((item) => item.id === editingProduct.id ? nextProduct : item) : [...items, nextProduct]);
    setSelectedProductId(nextId);
    setEditingProduct(null);
    setFormOpen(false);
  }

  if (!authReady) {
    return <main className="min-h-screen bg-white" />;
  }
  if (!session) return null;

  return (
    <main className="min-h-screen bg-white pb-28 text-zinc-900" onClick={closeOverlays}>
      <div className="relative z-20 mx-auto min-h-screen w-full max-w-sm px-7 pb-8 pt-8" onClick={(event) => event.stopPropagation()}>
        {tab === "dashboard" && view !== "selected" ? (
          <Dashboard budget={budget} dbError={dbError} draftBudget={draftBudget} hoveredId={hoveredId} menuMode={menuMode} menuOpen={menuOpen} remaining={remaining} selectedProducts={selectedProducts} selectedTotal={selectedTotal} session={session} onLogout={() => handleLogout(router)} onBudgetChange={setDraftBudget} onHover={setHoveredId} onMenuMode={setMenuMode} onMenuOpen={setMenuOpen} onSaveBudget={saveBudget} onSelectedList={() => { setView("selected"); setMenuOpen(false); }} />
        ) : view === "selected" ? (
          <SelectedList selectedProducts={selectedProducts} onBack={() => setView("category")} onDetail={(id) => { setSelectedProductId(id); setView("detail"); }} onFavorite={toggleFavorite} />
        ) : view === "items" ? (
          <ProductList category={selectedCategory} items={visibleProducts} query={query} minPrice={minPrice} searchOpen={searchOpen} onBack={() => setView("category")} onDetail={(id) => { setSelectedProductId(id); setView("detail"); }} onQuery={setQuery} onSearchOpen={setSearchOpen} onMinPrice={setMinPrice} onMaxPrice={setMaxPrice} onFavorite={toggleFavorite} maxPrice={maxPrice} />
        ) : view === "detail" ? (
          <ProductDetail product={selectedProduct} onBack={() => setView("items")} onFavorite={toggleFavorite} onEdit={(product) => { setEditingProduct(product); setFormOpen(true); }} />
        ) : (
          <CategoryScreen title={tab === "appliances" ? label.appliances : label.furniture} categories={activeCategories} products={products} onCategory={(id) => { setSelectedCategoryId(id); setView("items"); setQuery(""); setMinPrice(0); setMaxPrice(500000); }} />
        )}
      </div>
      {tab !== "dashboard" && view !== "detail" ? <FloatingAdd isOpen={addOpen} onManual={() => { setAddOpen(false); setFormOpen(true); }} onOpenChange={setAddOpen} /> : null}
      {formOpen ? <ProductForm categories={categories} currentType={currentType} initialCategoryId={selectedCategory?.id} product={editingProduct} allTags={Array.from(new Set([...categories.flatMap((category) => category.tags), ...products.flatMap((product) => product.tags)]))} onClose={() => { setEditingProduct(null); setFormOpen(false); }} onSave={saveProduct} /> : null}
      <FooterNav tab={tab} onTabChange={switchTab} />
    </main>
  );
}

function matchSearch(product: Product, query: string, minPrice: number, maxPrice: number) {
  return product.price >= minPrice && product.price <= maxPrice && (query === "" || product.name.includes(query) || product.maker.includes(query) || product.tags.some((tag) => tag.includes(query)));
}

async function saveItemTags(itemId: string, householdId: string, tags: string[]) {
  if (!supabase) return "";
  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  const { error: deleteError } = await supabase.from("item_tags").delete().eq("item_id", itemId);
  if (deleteError) return deleteError.message;
  if (!uniqueTags.length) return "";
  const { data: savedTags, error: tagError } = await supabase.from("tags").upsert(uniqueTags.map((name) => ({ household_id: householdId, name })), { onConflict: "household_id,name" }).select("id,name").returns<TagRow[]>();
  if (tagError) return tagError.message;
  const { error: linkError } = await supabase.from("item_tags").insert((savedTags ?? []).map((tag) => ({ item_id: itemId, tag_id: tag.id })));
  return linkError?.message ?? "";
}


async function handleLogout(router: ReturnType<typeof useRouter>) {
  if (!supabase) return;
  await supabase.auth.signOut();
  router.push("/login");
}

function Dashboard(props: { budget: number; dbError: string; draftBudget: string; hoveredId: string | null; menuMode: MenuMode; menuOpen: boolean; remaining: number; selectedProducts: Product[]; selectedTotal: number; session: Session | null; onLogout: () => Promise<void>; onBudgetChange: (v: string) => void; onHover: (id: string | null) => void; onMenuMode: (v: MenuMode) => void; onMenuOpen: (v: boolean) => void; onSaveBudget: () => void; onSelectedList: () => void }) {
  const hovered = props.selectedProducts.find((product) => product.id === props.hoveredId);
  const [userOpen, setUserOpen] = useState(false);
  function closeDashboardPopups() { setUserOpen(false); props.onMenuOpen(false); }

  return (
    <section className="space-y-7">
      {userOpen || props.menuOpen ? <div className="fixed inset-0 z-30" onClick={closeDashboardPopups} /> : null}
      <header className="relative flex min-h-12 items-center justify-center">
        <button aria-label="user" className="absolute left-0 top-0 z-40 grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-lime-100/70 hover:text-emerald-700" onClick={() => setUserOpen(!userOpen)}>
          <UserRound size={18} strokeWidth={2.2} />
        </button>
        {userOpen ? (
          <div className="absolute left-0 top-12 z-50 w-52 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
            <p className="text-sm font-semibold text-zinc-600">{props.session?.user.email ?? label.loginMissing}</p>
            <button className="mt-3 w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={props.onLogout}>{label.logout}</button>
          </div>
        ) : null}
        <h1 className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white"><HomeIcon size={18} /></span>
          <span className="text-[22px] font-semibold tracking-normal text-emerald-800">Home Budget</span>
        </h1>
        <div className="absolute right-0 top-0 z-40">
          <button aria-label="menu" className="grid h-10 w-10 place-items-center rounded-full text-zinc-600 hover:bg-lime-100/70 hover:text-emerald-700" onClick={() => props.onMenuOpen(!props.menuOpen)}>
            <MoreHorizontal size={23} />
          </button>
          {props.menuOpen ? (
            <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
              {props.menuMode === "root" ? (
                <>
                  <MenuItem onClick={() => props.onMenuMode("budget")}>{label.budgetManage}</MenuItem>
                  <MenuItem onClick={props.onSelectedList}>{label.selectedList}</MenuItem>
                </>
              ) : (
                <div className="p-2">
                  <p className="mb-3 text-sm font-semibold">{label.budget}</p>
                  <input className="mb-3 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" inputMode="numeric" value={props.draftBudget} onChange={(e) => props.onBudgetChange(e.target.value)} />
                  <button className="mb-2 h-10 w-full rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-700 hover:bg-lime-100/70" onClick={() => props.onMenuMode("root")}>{label.cancel}</button>
                  <button className="h-10 w-full rounded-xl bg-zinc-900 text-sm font-bold text-white hover:bg-emerald-700" onClick={props.onSaveBudget}>{label.save}</button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <Amount label={label.budget} value={yen(props.budget)} />
        <Amount label={label.remaining} value={yen(props.remaining)} tone={props.remaining < 0 ? "bad" : "good"} />
      </div>
      <div className="relative flex justify-center py-2">
        <Donut items={props.selectedProducts} total={props.selectedTotal} hoveredId={props.hoveredId} onHover={props.onHover} />
        {hovered ? <HoverCard product={hovered} /> : null}
      </div>
      {props.dbError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{props.dbError}</div> : null}
      <div className="space-y-2">
        {props.selectedProducts.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-1 hover:bg-zinc-50" onMouseEnter={() => props.onHover(item.id)} onMouseLeave={() => props.onHover(null)}>
            <span className="flex items-center gap-3 font-semibold"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
            <span className="text-sm font-semibold text-zinc-700">{yen(item.price)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SelectedList({ selectedProducts, onBack, onDetail, onFavorite }: { selectedProducts: Product[]; onBack: () => void; onDetail: (id: string) => void; onFavorite: (id: string) => void }) {
  return <section><Top title={label.selectedList} back={onBack} searchOpen={false} onSearchOpen={() => undefined} hideSearch /><ListBlock items={selectedProducts} onDetail={onDetail} onFavorite={onFavorite} /></section>;
}

function ListBlock({ items, onDetail, onFavorite }: { items: Product[]; onDetail: (id: string) => void; onFavorite: (id: string) => void }) {
  return <div className="space-y-3">{items.length ? items.map((item) => <ProductRow key={item.id} item={item} onClick={() => onDetail(item.id)} onFavorite={onFavorite} />) : <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">{label.noItems}</p>}</div>;
}

function Donut({ items, total, hoveredId, onHover }: { items: Product[]; total: number; hoveredId: string | null; onHover: (id: string | null) => void }) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const arcs = items.reduce<{ cursor: number; arcs: { item: Product; dash: string; offset: number }[] }>((acc, item) => {
    const length = total ? (item.price / total) * circumference : 0;
    return { cursor: acc.cursor + length, arcs: [...acc.arcs, { item, dash: `${Math.max(0, length - 3)} ${circumference}`, offset: -acc.cursor }] };
  }, { cursor: 0, arcs: [] }).arcs;

  return (
    <svg viewBox="0 0 220 220" className="h-60 w-60 -rotate-90 overflow-visible">
      <circle cx="110" cy="110" r={radius} fill="none" stroke="#ffffff" strokeWidth="34" />
      {arcs.map(({ item, dash, offset }) => (
        <circle key={item.id} cx="110" cy="110" r={radius} fill="none" stroke={item.color} strokeWidth="34" strokeDasharray={dash} strokeDashoffset={offset} onMouseEnter={() => onHover(item.id)} onMouseLeave={() => onHover(null)} className={`cursor-pointer transition-all duration-200 ${hoveredId === item.id ? "opacity-90 drop-shadow-md" : "opacity-100"}`} style={{ transform: hoveredId === item.id ? "scale(1.03)" : "scale(1)", transformOrigin: "110px 110px" }} />
      ))}
      <g className="rotate-90 origin-center">
        <text x="110" y="102" textAnchor="middle" className="fill-zinc-500 text-xs font-semibold">選択中</text>
        <text x="110" y="126" textAnchor="middle" className="fill-zinc-900 text-lg font-semibold">{yen(total)}</text>
      </g>
    </svg>
  );
}

function HoverCard({ product }: { product: Product }) { return <div className="absolute left-1/2 top-7 z-30 w-44 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-xl"><img src={product.image} alt="" className="mb-2 h-20 w-full rounded-xl object-cover" /><p className="text-sm font-bold">{product.name}</p><p className="text-sm font-semibold text-emerald-700">{yen(product.price)}</p></div>; }
function Amount({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) { return <div className="rounded-2xl bg-zinc-50 p-4"><p className="mb-2 text-sm text-zinc-500">{label}</p><p className={`text-lg font-medium ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-700" : "text-zinc-900"}`}>{value}</p></div>; }
function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-lime-100/70 hover:text-emerald-700" onClick={onClick}>{children}</button>; }

function CategoryScreen({ title, categories, products, onCategory }: { title: string; categories: Category[]; products: Product[]; onCategory: (id: string) => void }) {
  return <section><Top title={title} searchOpen={false} onSearchOpen={() => undefined} hideSearch /><div className="space-y-1">{categories.map((category) => { const count = products.filter((p) => p.categoryId === category.id).length; return <button key={category.id} className="w-full rounded-xl border-b border-zinc-100 px-2 py-5 text-left hover:bg-zinc-50" onClick={() => onCategory(category.id)}><div className="flex items-center justify-between"><div><p className="text-lg font-semibold">{category.name}</p><p className="mt-1 text-sm text-zinc-500">{count}件</p></div><p className="text-base font-semibold text-zinc-700">{yen(category.budgetAmount)}</p></div><div className="mt-3 flex flex-wrap gap-2">{category.tags.map((tag) => <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600" key={tag}>{tag}</span>)}</div></button>; })}</div></section>;
}

function ProductList({ category, items, query, minPrice, maxPrice, searchOpen, onBack, onDetail, onFavorite, onQuery, onSearchOpen, onMinPrice, onMaxPrice }: { category?: Category; items: Product[]; query: string; minPrice: number; maxPrice: number; searchOpen: boolean; onBack: () => void; onDetail: (id: string) => void; onFavorite: (id: string) => void; onQuery: (v: string) => void; onSearchOpen: (v: boolean) => void; onMinPrice: (v: number) => void; onMaxPrice: (v: number) => void }) {
  const tags = Array.from(new Set(items.flatMap((item) => item.tags)));
  return <section><Top title={category?.name ?? ""} back={onBack} searchOpen={searchOpen} onSearchOpen={onSearchOpen} />{searchOpen ? <SearchPanel query={query} minPrice={minPrice} maxPrice={maxPrice} tags={tags} onQuery={onQuery} onMinPrice={onMinPrice} onMaxPrice={onMaxPrice} /> : null}<div className="space-y-3">{items.length ? items.map((item) => <ProductRow key={item.id} item={item} onClick={() => onDetail(item.id)} onFavorite={onFavorite} />) : <p className="py-10 text-center text-zinc-500">{label.noItems}</p>}</div></section>;
}

function Top({ title, back, searchOpen, onSearchOpen, hideSearch = false }: { title: string; back?: () => void; searchOpen: boolean; onSearchOpen: (v: boolean) => void; hideSearch?: boolean }) {
  return <header className="mb-6 flex min-h-12 items-center justify-between"><div className="flex items-center gap-2">{back ? <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-zinc-100" onClick={back}><ChevronLeft size={24} /></button> : null}<h1 className="text-2xl font-semibold tracking-normal text-zinc-900">{title}</h1></div>{!hideSearch ? <button aria-label="search" className={`grid h-10 w-10 place-items-center rounded-full ${searchOpen ? "bg-lime-100/70 text-emerald-700" : "text-zinc-700 hover:bg-lime-100/70 hover:text-emerald-700"}`} onClick={() => onSearchOpen(!searchOpen)}><Search size={22} /></button> : null}</header>;
}

function SearchPanel({ query, minPrice, maxPrice, tags, grouped, onQuery, onMinPrice, onMaxPrice }: { query: string; minPrice: number; maxPrice: number; tags: string[]; grouped?: boolean; onQuery: (v: string) => void; onMinPrice: (v: number) => void; onMaxPrice: (v: number) => void }) {
  return <div className="mb-6 space-y-4 rounded-2xl bg-zinc-50 p-4"><input className="h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" placeholder={label.searchPlaceholder} value={query} onChange={(e) => onQuery(e.target.value)} /><div><div className="mb-2 flex justify-between text-sm font-semibold text-zinc-600"><span>{label.price}</span><span>{yen(minPrice)} - {yen(maxPrice)}</span></div><DualRange min={minPrice} max={maxPrice} onMin={onMinPrice} onMax={onMaxPrice} /></div><div className="space-y-2">{tags.map((tag) => <button key={tag} className={grouped ? "flex w-full items-center justify-between rounded-xl bg-white px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-lime-100/70" : "rounded-full bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-lime-100/70 hover:text-emerald-700"}><span>{tag}</span>{grouped ? <ChevronDown size={14} /> : null}</button>)}</div></div>;
}

function DualRange({ min, max, onMin, onMax }: { min: number; max: number; onMin: (v: number) => void; onMax: (v: number) => void }) {
  const left = (min / 500000) * 100;
  const right = 100 - (max / 500000) * 100;
  return <div className="relative h-8"><div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-200" /><div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-700" style={{ left: left + "%", right: right + "%" }} /><input className="range-thumb pointer-events-none absolute inset-x-0 top-0 w-full appearance-none bg-transparent" type="range" min="0" max="500000" step="10000" value={min} onChange={(e) => onMin(Math.min(Number(e.target.value), max - 10000))} /><input className="range-thumb pointer-events-none absolute inset-x-0 top-0 w-full appearance-none bg-transparent" type="range" min="0" max="500000" step="10000" value={max} onChange={(e) => onMax(Math.max(Number(e.target.value), min + 10000))} /></div>;
}

function ProductRow({ item, onClick, onFavorite }: { item: Product; onClick: () => void; onFavorite: (id: string) => void }) {
  return <div role="button" tabIndex={0} className="flex w-full cursor-pointer gap-3 rounded-xl border-b border-zinc-100 px-2 py-4 text-left hover:bg-zinc-50" onClick={onClick} onKeyDown={(event) => { if (event.key === "Enter") onClick(); }}><img src={item.image} alt="" className="h-18 w-18 rounded-2xl object-cover bg-zinc-100" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold leading-snug">{item.name}</p><p className="mt-1 text-sm text-zinc-500">{item.maker}</p></div><button aria-label="select" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-lime-100/70" onClick={(event) => { event.stopPropagation(); onFavorite(item.id); }}><Heart size={20} className={item.selected ? "fill-emerald-600 text-emerald-600" : "text-zinc-400"} /></button></div><div className="mt-2 flex flex-wrap gap-1">{item.tags.slice(0, 3).map((tag) => <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-600" key={tag}>{tag}</span>)}</div></div><p className="self-center whitespace-nowrap text-base font-semibold text-emerald-700">{yen(item.price)}</p></div>;
}

function ProductDetail({ product, onBack, onFavorite, onEdit }: { product?: Product; onBack: () => void; onFavorite: (id: string) => void; onEdit: (product: Product) => void }) { if (!product) return null; const rows = [[label.maker, product.maker], [label.model, product.model], [label.price, yen(product.price)], ["URL", product.url], [label.shop, product.shop], [label.memo, product.memo]]; return <section><header className="mb-5 flex items-center justify-between"><button className="grid h-10 w-10 place-items-center rounded-full hover:bg-zinc-100" onClick={onBack}><ChevronLeft size={24} /></button><button aria-label="favorite" className="grid h-10 w-10 place-items-center rounded-full hover:bg-lime-100/70" onClick={() => onFavorite(product.id)}><Heart size={22} className={product.selected ? "fill-emerald-600 text-emerald-600" : "text-zinc-400"} /></button></header><h1 className="mb-4 text-2xl font-semibold tracking-normal text-zinc-900">{product.name}</h1><img src={product.image} alt="" className="mb-5 h-48 w-full rounded-3xl object-cover bg-zinc-100" /><div className="space-y-3">{rows.map(([key, value]) => <div key={key} className="border-b border-zinc-100 pb-3"><p className="text-xs font-semibold text-zinc-400">{key}</p><p className="mt-1 break-all font-medium">{value}</p></div>)}<div className="flex flex-wrap gap-2 pt-2">{product.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{tag}</span>)}</div></div><button className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => onEdit(product)}><Edit3 size={17} />{label.edit}</button></section>; }

function ProductForm({ categories, currentType, initialCategoryId, product, allTags, onClose, onSave }: { categories: Category[]; currentType: CategoryType; initialCategoryId?: string; product: Product | null; allTags: string[]; onClose: () => void; onSave: (draft: ProductDraft) => void }) {
  const availableCategories = categories.filter((category) => category.type === currentType);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? initialCategoryId ?? availableCategories[0]?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [maker, setMaker] = useState(product?.maker ?? "");
  const [model, setModel] = useState(product?.model ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [url, setUrl] = useState(product?.url ?? "");
  const [shop, setShop] = useState(product?.shop ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [memo, setMemo] = useState(product?.memo ?? "");
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [tagSelect, setTagSelect] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selected, setSelected] = useState(product?.selected ?? false);
  const tagOptions = allTags.filter((tag) => !tags.includes(tag));
  function addTag(tag: string) { if (tag && !tags.includes(tag)) setTags((current) => [...current, tag]); }
  function submit(event: FormEvent) { event.preventDefault(); onSave({ categoryId, name: name || label.unnamed, maker, model, price: Number(price) || 0, url, shop, image: image || "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&auto=format&fit=crop", tags, memo, selected, favorite: selected }); }
  return <div className="fixed inset-0 z-50 bg-black/20 px-5 py-8" onClick={onClose}><form className="mx-auto max-h-[calc(100vh-4rem)] w-full max-w-sm space-y-3 overflow-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} onSubmit={submit}><div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">{product ? label.editProduct : label.manual}</h2><button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-zinc-100" onClick={onClose}><X size={20} /></button></div><select className="h-11 w-full rounded-xl border border-zinc-200 px-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Field placeholder={label.productName} value={name} onChange={setName} /><Field placeholder={label.maker} value={maker} onChange={setMaker} /><Field placeholder={label.model} value={model} onChange={setModel} /><Field placeholder={label.price} value={price} onChange={setPrice} inputMode="numeric" /><Field placeholder="URL" value={url} onChange={setUrl} /><Field placeholder={label.shop} value={shop} onChange={setShop} /><Field placeholder={label.imageUrl} value={image} onChange={setImage} /><div className="space-y-2"><select className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" value={tagSelect} onChange={(e) => { addTag(e.target.value); setTagSelect(""); }}><option value="">{label.tagCsv}</option>{tagOptions.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" onClick={() => setTags((current) => current.filter((item) => item !== tag))}>{tag}<span className="ml-1">x</span></button>)}</div>{addingTag ? <div className="flex gap-2"><input className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600" placeholder={label.newTag} value={newTag} onChange={(e) => setNewTag(e.target.value)} /><button type="button" className="rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white" onClick={() => { addTag(newTag.trim()); setNewTag(""); setAddingTag(false); }}>{label.addTag}</button></div> : <button type="button" className="inline-flex h-8 items-center rounded-full border border-emerald-700 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50" onClick={() => setAddingTag(true)}>{label.addTag}</button>}</div><textarea className="min-h-20 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-emerald-600" placeholder={label.memo} value={memo} onChange={(e) => setMemo(e.target.value)} /><label className="flex items-center gap-2 text-sm font-semibold text-zinc-600"><input type="checkbox" checked={selected} onChange={(e) => setSelected(e.target.checked)} />{label.markSelected}</label><button className="h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-emerald-700">{label.save}</button></form></div>;
}

function Field({ placeholder, value, onChange, inputMode }: { placeholder: string; value: string; onChange: (value: string) => void; inputMode?: "numeric" }) { return <input className="h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" placeholder={placeholder} value={value} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />; }

function FloatingAdd({ isOpen, onManual, onOpenChange }: { isOpen: boolean; onManual: () => void; onOpenChange: (value: boolean) => void }) { return <>{isOpen ? <div className="fixed inset-0 z-20" onClick={() => onOpenChange(false)} /> : null}<div className="fixed inset-x-0 bottom-23 z-30 mx-auto flex w-full max-w-sm justify-end px-7">{isOpen ? <div className="absolute bottom-17 right-7 w-64 rounded-3xl border border-zinc-200 bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}><MenuAdd icon={<ImagePlus size={20} />} text={label.fromPhoto} /><MenuAdd icon={<Sparkles size={20} />} text={label.fromUrl} /><MenuAdd icon={<Plus size={20} />} text={label.manual} onClick={onManual} /></div> : null}<button aria-label="add" className="grid h-15 w-15 place-items-center rounded-full bg-zinc-900 text-white shadow-xl hover:bg-emerald-700" onClick={(e) => { e.stopPropagation(); onOpenChange(!isOpen); }}>{isOpen ? <X size={26} /> : <Plus size={30} />}</button></div></>; }
function MenuAdd({ icon, text, onClick }: { icon: ReactNode; text: string; onClick?: () => void }) { return <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-lime-100/70 hover:text-emerald-700" onClick={onClick}><span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100">{icon}</span><span className="font-bold">{text}</span></button>; }
function FooterNav({ tab, onTabChange }: { tab: Tab; onTabChange: (tab: Tab) => void }) { return <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-sm border-t border-zinc-200 bg-white/95 px-7 pb-5 pt-2 backdrop-blur"><div className="grid grid-cols-3"><TabButton active={tab === "dashboard"} icon={<BarChart3 size={20} />} onClick={() => onTabChange("dashboard")}>{label.dashboard}</TabButton><TabButton active={tab === "appliances"} icon={<Refrigerator size={20} />} onClick={() => onTabChange("appliances")}>{label.appliances}</TabButton><TabButton active={tab === "furniture"} icon={<Armchair size={20} />} onClick={() => onTabChange("furniture")}>{label.furniture}</TabButton></div></nav>; }
function TabButton({ active, children, icon, onClick }: { active: boolean; children: ReactNode; icon: ReactNode; onClick: () => void }) { return <button className={`flex h-14 flex-col items-center justify-center gap-1 px-1 text-[0.65rem] leading-none font-semibold transition-colors hover:bg-lime-100/70 hover:text-emerald-700 rounded-xl whitespace-nowrap ${active ? "text-emerald-700" : "text-zinc-500"}`} onClick={onClick}>{icon}<span className="leading-none">{children}</span></button>; }













