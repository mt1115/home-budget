"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Armchair, BarChart3, ChevronDown, ChevronLeft, Edit3, Heart, ImagePlus, MoreHorizontal, Plus, Refrigerator, Search, Sparkles, X, HomeIcon } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Tab = "dashboard" | "appliances" | "furniture";
type CategoryType = "appliance" | "furniture";
type View = "category" | "items" | "detail" | "selected";
type MenuMode = "root" | "budget";

type Category = { id: string; type: CategoryType; name: string; budgetAmount: number; tags: string[] };
type Product = { id: string; categoryId: string; name: string; maker: string; model: string; price: number; url: string; shop: string; image: string; tags: string[]; memo: string; selected: boolean; favorite: boolean; color: string };
type SettingsRow = { total_budget: number };
type CategoryRow = { id: string; type: CategoryType; name: string; budget_amount: number | null; sort_order: number | null };
type ItemRow = { id: string; category_id: string; name: string; maker: string | null; model_number: string | null; price: number | null; url: string | null; image_url: string | null; shop_name: string | null; memo: string | null; status: "candidate" | "selected" | "on_hold" | "purchased" };

const label = {
  dashboard: "\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9",
  appliances: "\u5bb6\u96fb",
  furniture: "\u5bb6\u5177",
  budget: "\u7dcf\u4e88\u7b97",
  remaining: "\u6b8b\u308a",
  selected: "\u9078\u629e\u4e2d",
  selectedList: "\u9078\u629e\u4e2d\u306e\u5bb6\u96fb\u30fb\u5bb6\u5177",
  budgetManage: "\u4e88\u7b97\u7ba1\u7406",
  save: "\u4fdd\u5b58",
  back: "\u623b\u308b",
  searchPlaceholder: "\u30ad\u30fc\u30ef\u30fc\u30c9\u3067\u691c\u7d22",
  minPrice: "\u4fa1\u683c",
  fromPhoto: "\u5199\u771f\u304b\u3089\u767b\u9332",
  fromUrl: "URL\u304b\u3089\u8aad\u307f\u53d6\u308a",
  manual: "\u624b\u5165\u529b\u3067\u8ffd\u52a0",
  edit: "\u7de8\u96c6",
  noItems: "\u8a72\u5f53\u306a\u3057",
};

const colors = ["#43a047", "#a7c957", "#f2cc4d", "#ff9f1c", "#2ec4b6", "#8bc34a"];
const formatter = new Intl.NumberFormat("ja-JP");
const yen = (value: number) => `${formatter.format(value)}\u5186`;

const initialCategories: Category[] = [
  { id: "fridge", type: "appliance", name: "\u51b7\u8535\u5eab", budgetAmount: 180000, tags: ["400L", "\u5e4560cm", "\u7701\u30a8\u30cd"] },
  { id: "washer", type: "appliance", name: "\u6d17\u6fef\u6a5f", budgetAmount: 128000, tags: ["\u4e7e\u71e5", "\u7701\u30a8\u30cd"] },
  { id: "aircon", type: "appliance", name: "\u30a8\u30a2\u30b3\u30f3", budgetAmount: 98000, tags: ["10\u7573", "\u81ea\u52d5\u6383\u9664"] },
  { id: "microwave", type: "appliance", name: "\u96fb\u5b50\u30ec\u30f3\u30b8", budgetAmount: 42000, tags: ["\u30aa\u30fc\u30d6\u30f3"] },
  { id: "bed", type: "furniture", name: "\u30d9\u30c3\u30c9", budgetAmount: 92000, tags: ["\u53ce\u7d0d", "\u4f4e\u3081"] },
  { id: "sofa", type: "furniture", name: "\u30bd\u30d5\u30a1", budgetAmount: 78000, tags: ["2\u4eba\u639b\u3051"] },
  { id: "dining", type: "furniture", name: "\u30c0\u30a4\u30cb\u30f3\u30b0", budgetAmount: 68000, tags: ["\u6728\u76ee"] },
  { id: "curtain", type: "furniture", name: "\u30ab\u30fc\u30c6\u30f3", budgetAmount: 36000, tags: ["\u906e\u5149"] },
];

const initialProducts: Product[] = [
  { id: "p1", categoryId: "fridge", name: "\u30b9\u30ea\u30e0\u51b7\u8535\u5eab 406L", maker: "Hitachi", model: "R-HWS47", price: 180000, url: "https://example.com/fridge", shop: "\u91cf\u8ca9\u5e97", image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=300&auto=format&fit=crop", tags: ["400L", "\u5e4560cm", "\u7701\u30a8\u30cd"], memo: "\u5e45\u304c\u5408\u3046", selected: true, favorite: true, color: colors[0] },
  { id: "p2", categoryId: "fridge", name: "\u771f\u3093\u4e2d\u91ce\u83dc\u5ba4 450L", maker: "Panasonic", model: "NR-F45", price: 168000, url: "https://example.com/fridge2", shop: "Web", image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&auto=format&fit=crop", tags: ["450L", "\u91ce\u83dc\u5ba4"], memo: "\u8272\u304c\u826f\u3044", selected: false, favorite: false, color: colors[1] },
  { id: "p3", categoryId: "washer", name: "\u30c9\u30e9\u30e0\u5f0f\u6d17\u6fef\u4e7e\u71e5\u6a5f", maker: "Toshiba", model: "TW-127", price: 128000, url: "https://example.com/washer", shop: "\u91cf\u8ca9\u5e97", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&auto=format&fit=crop", tags: ["\u4e7e\u71e5", "\u7701\u30a8\u30cd"], memo: "\u4e7e\u71e5\u91cd\u8996", selected: true, favorite: true, color: colors[1] },
  { id: "p4", categoryId: "bed", name: "\u53ce\u7d0d\u4ed8\u304d\u30d9\u30c3\u30c9", maker: "Nitori", model: "BD-LOW", price: 92000, url: "https://example.com/bed", shop: "Nitori", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300&auto=format&fit=crop", tags: ["\u53ce\u7d0d", "\u4f4e\u3081"], memo: "\u5bdd\u5ba4\u306b\u5408\u3046", selected: true, favorite: false, color: colors[2] },
  { id: "p5", categoryId: "sofa", name: "2\u4eba\u639b\u3051\u30bd\u30d5\u30a1", maker: "Muji", model: "SF-2", price: 78000, url: "https://example.com/sofa", shop: "Muji", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop", tags: ["2\u4eba\u639b\u3051"], memo: "\u5ea7\u308a\u5fc3\u5730\u304c\u826f\u3044", selected: true, favorite: true, color: colors[3] },
  { id: "p6", categoryId: "curtain", name: "\u906e\u5149\u30ab\u30fc\u30c6\u30f3", maker: "KEYUCA", model: "CT-BK", price: 36000, url: "https://example.com/curtain", shop: "KEYUCA", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop", tags: ["\u906e\u5149"], memo: "\u30ea\u30d3\u30f3\u30b0\u7528", selected: true, favorite: false, color: colors[4] },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [view, setView] = useState<View>("category");
  const [budget, setBudget] = useState(800000);
  const [draftBudget, setDraftBudget] = useState("800000");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<MenuMode>("root");
  const [addOpen, setAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250000);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [dbMessage, setDbMessage] = useState(isSupabaseConfigured ? "Supabase\u78ba\u8a8d\u4e2d" : "\u672a\u63a5\u7d9a");

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!supabase) return;
      const [{ data: settings }, { data: categoryRows, error: categoryError }, { data: itemRows, error: itemError }] = await Promise.all([
        supabase.from("settings").select("total_budget").limit(1).maybeSingle<SettingsRow>(),
        supabase.from("categories").select("id,type,name,budget_amount,sort_order").order("sort_order", { ascending: true }).returns<CategoryRow[]>(),
        supabase.from("items").select("id,category_id,name,maker,model_number,price,url,image_url,shop_name,memo,status").returns<ItemRow[]>(),
      ]);
      if (ignore) return;
      if (categoryError || itemError) { setDbMessage("\u672a\u63a5\u7d9a"); return; }
      if (settings?.total_budget) { setBudget(settings.total_budget); setDraftBudget(String(settings.total_budget)); }
      if (categoryRows?.length) {
        setCategories(categoryRows.map((c) => ({ id: c.id, type: c.type, name: c.name, budgetAmount: c.budget_amount ?? 0, tags: [] })));
        setProducts((itemRows ?? []).map((item, index) => ({ id: item.id, categoryId: item.category_id, name: item.name, maker: item.maker ?? "", model: item.model_number ?? "", price: item.price ?? 0, url: item.url ?? "", shop: item.shop_name ?? "", image: item.image_url ?? "", tags: [], memo: item.memo ?? "", selected: item.status === "selected", favorite: false, color: colors[index % colors.length] })));
        setDbMessage("Supabase\u63a5\u7d9a\u4e2d");
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const selectedProducts = products.filter((product) => product.selected);
  const selectedTotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
  const remaining = budget - selectedTotal;
  const currentType: CategoryType = tab === "furniture" ? "furniture" : "appliance";
  const activeCategories = categories.filter((category) => category.type === currentType);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? activeCategories[0];
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? selectedProducts[0];
  const visibleProducts = products.filter((product) => product.categoryId === selectedCategory?.id).filter((product) => matchSearch(product, query, minPrice, maxPrice));
  const visibleCategories = activeCategories.filter((category) => category.name.includes(query) || category.tags.some((tag) => tag.includes(query)) || query === "");

  function closeOverlays() { setMenuOpen(false); setAddOpen(false); }
  function switchTab(next: Tab) { setTab(next); setView("category"); setSearchOpen(false); setSelectedCategoryId(null); closeOverlays(); }
  function saveBudget() { const next = Number(draftBudget.replace(/,/g, "")); if (!Number.isNaN(next) && next > 0) { setBudget(next); setDraftBudget(String(next)); setMenuMode("root"); setMenuOpen(false); } }

  return (
    <main className="min-h-screen bg-white pb-28 text-zinc-900" onClick={closeOverlays}>
      <div className="mx-auto min-h-screen w-full max-w-sm px-7 pb-8 pt-8" onClick={(event) => event.stopPropagation()}>
        {tab === "dashboard" ? (
          <Dashboard budget={budget} dbMessage={dbMessage} draftBudget={draftBudget} hoveredId={hoveredId} menuMode={menuMode} menuOpen={menuOpen} remaining={remaining} selectedProducts={selectedProducts} selectedTotal={selectedTotal} onBudgetChange={setDraftBudget} onHover={setHoveredId} onMenuMode={setMenuMode} onMenuOpen={setMenuOpen} onSaveBudget={saveBudget} onBack={() => setView("category")} onSelectedList={() => { setView("selected"); setMenuOpen(false); }} view={view} product={selectedProduct} />
        ) : view === "items" ? (
          <ProductList category={selectedCategory} items={visibleProducts} query={query} minPrice={minPrice} searchOpen={searchOpen} onBack={() => setView("category")} onDetail={(id) => { setSelectedProductId(id); setView("detail"); }} onQuery={setQuery} onSearchOpen={setSearchOpen} onMinPrice={setMinPrice} onMaxPrice={setMaxPrice} maxPrice={maxPrice} />
        ) : view === "detail" ? (
          <ProductDetail product={selectedProduct} onBack={() => setView("items")} />
        ) : (
          <CategoryScreen title={tab === "appliances" ? label.appliances : label.furniture} categories={visibleCategories} products={products} query={query} minPrice={minPrice} searchOpen={searchOpen} onCategory={(id) => { setSelectedCategoryId(id); setView("items"); setQuery(""); }} onQuery={setQuery} onSearchOpen={setSearchOpen} onMinPrice={setMinPrice} onMaxPrice={setMaxPrice} maxPrice={maxPrice} />
        )}
      </div>
      {tab !== "dashboard" && view !== "detail" ? <FloatingAdd isOpen={addOpen} onOpenChange={setAddOpen} /> : null}
      <FooterNav tab={tab} onTabChange={switchTab} />
    </main>
  );
}

function matchSearch(product: Product, query: string, minPrice: number, maxPrice: number) { return product.price >= minPrice && product.price <= maxPrice && (query === "" || product.name.includes(query) || product.maker.includes(query) || product.tags.some((tag) => tag.includes(query))); }

function Dashboard(props: { budget: number; dbMessage: string; draftBudget: string; hoveredId: string | null; menuMode: MenuMode; menuOpen: boolean; remaining: number; selectedProducts: Product[]; selectedTotal: number; product?: Product; view: View; onBudgetChange: (v: string) => void; onHover: (id: string | null) => void; onMenuMode: (v: MenuMode) => void; onMenuOpen: (v: boolean) => void; onSaveBudget: () => void; onSelectedList: () => void; onBack: () => void }) {
  if (props.view === "selected") return <SelectedList items={props.selectedProducts} onBack={props.onBack} />;
  const hovered = props.selectedProducts.find((product) => product.id === props.hoveredId);
  return <section className="space-y-7">
    <header className="relative flex min-h-12 items-center justify-center">
      <h1 className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white"><HomeIcon size={18} /></span><span className="text-[22px] font-semibold tracking-normal text-emerald-800">Home Budget</span></h1>
      <div className="absolute right-0 top-0">
        <button aria-label="menu" className="grid h-10 w-10 place-items-center rounded-full text-zinc-600 hover:bg-lime-100/70 hover:text-emerald-700" onClick={() => props.onMenuOpen(!props.menuOpen)}><MoreHorizontal size={23} /></button>
        {props.menuOpen ? <div className="absolute right-0 top-12 z-40 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          {props.menuMode === "root" ? <><MenuItem onClick={() => props.onMenuMode("budget")}>{label.budgetManage}</MenuItem><MenuItem onClick={props.onSelectedList}>{label.selectedList}</MenuItem></> : <div className="p-2"><button className="mb-3 text-sm font-semibold text-zinc-500 hover:text-emerald-700" onClick={() => props.onMenuMode("root")}>{label.back}</button><p className="mb-3 text-sm font-semibold">{label.budget}</p><input className="mb-3 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" inputMode="numeric" value={props.draftBudget} onChange={(e) => props.onBudgetChange(e.target.value)} /><button className="h-10 w-full rounded-xl bg-zinc-900 text-sm font-bold text-white" onClick={props.onSaveBudget}>{label.save}</button></div>}
        </div> : null}
      </div>
    </header>
    <div className="grid grid-cols-2 gap-4"><Amount label={label.budget} value={yen(props.budget)} /><Amount label={label.remaining} value={yen(props.remaining)} tone={props.remaining < 0 ? "bad" : "good"} /></div>
    <div className="relative flex justify-center py-2"><Donut items={props.selectedProducts} total={props.selectedTotal} onHover={props.onHover} />{hovered ? <HoverCard product={hovered} /> : null}</div>
    <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500"><span>{props.dbMessage}</span></div>
    <div className="space-y-2">{props.selectedProducts.map((item) => <div key={item.id} className="flex items-center justify-between py-1"><span className="flex items-center gap-3 font-semibold"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="text-sm font-bold text-zinc-700">{yen(item.price)}</span></div>)}</div>
  </section>;
}

function Donut({ items, total, onHover }: { items: Product[]; total: number; onHover: (id: string | null) => void }) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const arcs = items.reduce<{ cursor: number; arcs: { item: Product; dash: string; offset: number }[] }>(
    (acc, item) => {
      const length = total ? (item.price / total) * circumference : 0;
      return {
        cursor: acc.cursor + length,
        arcs: [...acc.arcs, { item, dash: `${Math.max(0, length - 7)} ${circumference}`, offset: -acc.cursor }],
      };
    },
    { cursor: 0, arcs: [] },
  ).arcs;

  return <svg viewBox="0 0 220 220" className="h-60 w-60 -rotate-90 overflow-visible"><circle cx="110" cy="110" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="34" />{arcs.map(({ item, dash, offset }) => <circle key={item.id} cx="110" cy="110" r={radius} fill="none" stroke={item.color} strokeWidth="34" strokeDasharray={dash} strokeDashoffset={offset} onMouseEnter={() => onHover(item.id)} onMouseLeave={() => onHover(null)} className="cursor-pointer transition-opacity hover:opacity-80" />)}<text x="110" y="104" textAnchor="middle" className="rotate-90 fill-zinc-500 text-xs font-semibold">{label.selected}</text><text x="110" y="128" textAnchor="middle" className="rotate-90 fill-zinc-900 text-lg font-semibold">{yen(total)}</text></svg>;
}
function HoverCard({ product }: { product: Product }) { return <div className="absolute left-1/2 top-7 z-30 w-44 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-xl"><img src={product.image} alt="" className="mb-2 h-20 w-full rounded-xl object-cover" /><p className="text-sm font-bold">{product.name}</p><p className="text-sm font-semibold text-emerald-700">{yen(product.price)}</p></div>; }
function Amount({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) { return <div className="rounded-2xl bg-zinc-50 p-4"><p className="mb-2 text-sm text-zinc-500">{label}</p><p className={`text-lg font-semibold ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-700" : "text-zinc-900"}`}>{value}</p></div>; }
function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-lime-100/70 hover:text-emerald-700" onClick={onClick}>{children}</button>; }

function CategoryScreen({ title, categories, products, query, minPrice, maxPrice, searchOpen, onCategory, onQuery, onSearchOpen, onMinPrice, onMaxPrice }: { title: string; categories: Category[]; products: Product[]; query: string; minPrice: number; maxPrice: number; searchOpen: boolean; onCategory: (id: string) => void; onQuery: (v: string) => void; onSearchOpen: (v: boolean) => void; onMinPrice: (v: number) => void; onMaxPrice: (v: number) => void }) { return <section><Top title={title} searchOpen={searchOpen} onSearchOpen={onSearchOpen} />{searchOpen ? <SearchPanel query={query} minPrice={minPrice} maxPrice={maxPrice} tags={categories.map((c) => c.name)} onQuery={onQuery} onMinPrice={onMinPrice} onMaxPrice={onMaxPrice} grouped /> : null}<div className="space-y-1">{categories.map((category) => { const count = products.filter((p) => p.categoryId === category.id).length; return <button key={category.id} className="w-full rounded-xl border-b border-zinc-100 px-2 py-5 text-left hover:bg-zinc-50" onClick={() => onCategory(category.id)}><div className="flex items-center justify-between"><div><p className="text-lg font-semibold">{category.name}</p><p className="mt-1 text-sm text-zinc-500">{count}\u4ef6</p></div><p className="text-base font-semibold text-zinc-700">{yen(category.budgetAmount)}</p></div><div className="mt-3 flex flex-wrap gap-2">{category.tags.map((tag) => <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600" key={tag}>{tag}</span>)}</div></button>; })}</div></section>; }
function ProductList({ category, items, query, minPrice, maxPrice, searchOpen, onBack, onDetail, onQuery, onSearchOpen, onMinPrice, onMaxPrice }: { category?: Category; items: Product[]; query: string; minPrice: number; maxPrice: number; searchOpen: boolean; onBack: () => void; onDetail: (id: string) => void; onQuery: (v: string) => void; onSearchOpen: (v: boolean) => void; onMinPrice: (v: number) => void; onMaxPrice: (v: number) => void }) { const tags = Array.from(new Set(items.flatMap((item) => item.tags))); return <section><Top title={category?.name ?? ""} back={onBack} searchOpen={searchOpen} onSearchOpen={onSearchOpen} />{searchOpen ? <SearchPanel query={query} minPrice={minPrice} maxPrice={maxPrice} tags={tags} onQuery={onQuery} onMinPrice={onMinPrice} onMaxPrice={onMaxPrice} /> : null}<div className="space-y-3">{items.length ? items.map((item) => <ProductRow key={item.id} item={item} onClick={() => onDetail(item.id)} />) : <p className="py-10 text-center text-zinc-500">{label.noItems}</p>}</div></section>; }
function Top({ title, back, searchOpen, onSearchOpen, hideSearch = false }: { title: string; back?: () => void; searchOpen: boolean; onSearchOpen: (v: boolean) => void; hideSearch?: boolean }) { return <header className="mb-6 flex min-h-12 items-center justify-between"><div className="flex items-center gap-2">{back ? <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-zinc-100" onClick={back}><ChevronLeft size={24} /></button> : null}<h1 className="text-3xl font-semibold tracking-normal text-zinc-900">{title}</h1></div>{!hideSearch ? <button aria-label="search" className={`grid h-10 w-10 place-items-center rounded-full ${searchOpen ? "bg-lime-100/70 text-emerald-700" : "text-zinc-700 hover:bg-lime-100/70 hover:text-emerald-700"}`} onClick={() => onSearchOpen(!searchOpen)}><Search size={22} /></button> : null}</header>; }
function SearchPanel({ query, minPrice, maxPrice, tags, grouped, onQuery, onMinPrice, onMaxPrice }: { query: string; minPrice: number; maxPrice: number; tags: string[]; grouped?: boolean; onQuery: (v: string) => void; onMinPrice: (v: number) => void; onMaxPrice: (v: number) => void }) { return <div className="mb-6 space-y-4 rounded-2xl bg-zinc-50 p-4"><input className="h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" placeholder={label.searchPlaceholder} value={query} onChange={(e) => onQuery(e.target.value)} /><div><div className="mb-2 flex justify-between text-sm font-semibold text-zinc-600"><span>{label.minPrice}</span><span>{yen(minPrice)} - {yen(maxPrice)}</span></div><input className="w-full accent-emerald-600" type="range" min="0" max="300000" step="10000" value={minPrice} onChange={(e) => onMinPrice(Math.min(Number(e.target.value), maxPrice))} /><input className="w-full accent-lime-600" type="range" min="0" max="300000" step="10000" value={maxPrice} onChange={(e) => onMaxPrice(Math.max(Number(e.target.value), minPrice))} /></div><div className="space-y-2">{tags.map((tag) => <button key={tag} className={grouped ? "flex w-full items-center justify-between rounded-xl bg-white px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-lime-100/70" : "rounded-full bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-lime-100/70 hover:text-emerald-700"}><span>{tag}</span>{grouped ? <ChevronDown size={14} /> : null}</button>)}</div></div>; }
function ProductRow({ item, onClick }: { item: Product; onClick: () => void }) { return <button className="flex w-full gap-3 rounded-xl border-b border-zinc-100 px-2 py-4 text-left hover:bg-zinc-50" onClick={onClick}><img src={item.image} alt="" className="h-18 w-18 rounded-2xl object-cover bg-zinc-100" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold leading-snug">{item.name}</p><p className="mt-1 text-sm text-zinc-500">{item.maker}</p></div><Heart size={20} className={item.favorite ? "fill-emerald-600 text-emerald-600" : "text-zinc-400"} /></div><div className="mt-2 flex flex-wrap gap-1">{item.tags.slice(0, 3).map((tag) => <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-600" key={tag}>{tag}</span>)}</div></div><p className="self-center whitespace-nowrap text-base font-semibold text-emerald-700">{yen(item.price)}</p></button>; }
function ProductDetail({ product, onBack }: { product?: Product; onBack: () => void }) { if (!product) return null; const rows = [["\u30e1\u30fc\u30ab\u30fc", product.maker], ["\u578b\u756a", product.model], ["\u4fa1\u683c", yen(product.price)], ["URL", product.url], ["\u5e97\u8217", product.shop], ["\u30e1\u30e2", product.memo]]; return <section><Top title={product.name} back={onBack} searchOpen={false} onSearchOpen={() => undefined} hideSearch /><img src={product.image} alt="" className="mb-5 h-48 w-full rounded-3xl object-cover bg-zinc-100" /><div className="space-y-3">{rows.map(([key, value]) => <div key={key} className="border-b border-zinc-100 pb-3"><p className="text-xs font-semibold text-zinc-400">{key}</p><p className="mt-1 break-all font-medium">{value}</p></div>)}<div className="flex flex-wrap gap-2 pt-2">{product.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{tag}</span>)}</div></div><button className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-emerald-700"><Edit3 size={17} />{label.edit}</button></section>; }function SelectedList({ items, onBack }: { items: Product[]; onBack: () => void }) { return <section><Top title={label.selectedList} back={onBack} searchOpen={false} onSearchOpen={() => undefined} hideSearch /><div className="space-y-3">{items.map((item) => <ProductRow key={item.id} item={item} onClick={() => undefined} />)}</div></section>; }
function FloatingAdd({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (value: boolean) => void }) { return <div className="fixed inset-x-0 bottom-23 z-30 mx-auto flex w-full max-w-sm justify-end px-7" onClick={(e) => e.stopPropagation()}>{isOpen ? <div className="absolute bottom-17 right-7 w-64 rounded-3xl border border-zinc-200 bg-white p-3 shadow-2xl"><MenuAdd icon={<ImagePlus size={20} />} text={label.fromPhoto} /><MenuAdd icon={<Sparkles size={20} />} text={label.fromUrl} /><MenuAdd icon={<Plus size={20} />} text={label.manual} /></div> : null}<button aria-label="add" className="grid h-15 w-15 place-items-center rounded-full bg-zinc-900 text-white shadow-xl hover:bg-emerald-700" onClick={() => onOpenChange(!isOpen)}>{isOpen ? <X size={26} /> : <Plus size={30} />}</button></div>; }
function MenuAdd({ icon, text }: { icon: React.ReactNode; text: string }) { return <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-lime-100/70 hover:text-emerald-700"><span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100">{icon}</span><span className="font-bold">{text}</span></button>; }
function FooterNav({ tab, onTabChange }: { tab: Tab; onTabChange: (tab: Tab) => void }) { return <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-sm border-t border-zinc-200 bg-white/95 px-7 pb-5 pt-2 backdrop-blur"><div className="grid grid-cols-3"><TabButton active={tab === "dashboard"} icon={<BarChart3 size={21} />} onClick={() => onTabChange("dashboard")}>{label.dashboard}</TabButton><TabButton active={tab === "appliances"} icon={<Refrigerator size={21} />} onClick={() => onTabChange("appliances")}>{label.appliances}</TabButton><TabButton active={tab === "furniture"} icon={<Armchair size={21} />} onClick={() => onTabChange("furniture")}>{label.furniture}</TabButton></div></nav>; }
function TabButton({ active, children, icon, onClick }: { active: boolean; children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) { return <button className={`flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors hover:bg-lime-100/70 hover:text-emerald-700 rounded-xl ${active ? "text-emerald-700" : "text-zinc-500"}`} onClick={onClick}>{icon}<span className="leading-none">{children}</span></button>; }
