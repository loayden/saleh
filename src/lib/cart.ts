export const CART_STORAGE_KEY = "saleh-cart";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  width: number | null;
  image: string | null;
  color: string;
  meters: number;
  cartItemId?: string;
};

export type CartProductInput = Omit<CartItem, "meters" | "color" | "cartItemId"> & {
  meters?: number;
  color?: string;
};

export function normalizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CartItem>;
  if (typeof item.id !== "string" || typeof item.slug !== "string" || typeof item.name !== "string") return null;
  const meters = Number(item.meters ?? 1);
  if (!Number.isFinite(meters) || meters <= 0) return null;
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    type: typeof item.type === "string" ? item.type : "",
    price: Number(item.price) || 0,
    stock: Number(item.stock) || 0,
    width: typeof item.width === "number" ? item.width : null,
    image: typeof item.image === "string" ? item.image : null,
    color: typeof item.color === "string" ? item.color : "",
    meters,
    ...(typeof item.cartItemId === "string" ? { cartItemId: item.cartItemId } : {}),
  };
}

export function readLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = window.localStorage.getItem(CART_STORAGE_KEY);
    const legacy = window.localStorage.getItem("nusj-cart");
    const parsed = JSON.parse(current || legacy || "[]") as unknown;
    const items = Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter(Boolean) as CartItem[] : [];
    if (!current && items.length) writeLocalCart(items);
    return items;
  } catch {
    return [];
  }
}

export function writeLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.localStorage.removeItem("nusj-cart");
  window.dispatchEvent(new Event("saleh-cart"));
  window.dispatchEvent(new Event(`saleh:${CART_STORAGE_KEY}`));
}

export function addLocalCartItem(input: CartProductInput): CartItem[] {
  const item = normalizeCartItem({ ...input, meters: input.meters ?? 1, color: input.color ?? "" });
  if (!item) return readLocalCart();
  const current = readLocalCart();
  const index = current.findIndex((entry) => entry.id === item.id && entry.color === item.color);
  if (index === -1) current.push(item);
  else current[index] = { ...current[index], meters: current[index].meters + item.meters };
  writeLocalCart(current);
  return current;
}

export function clearLocalCart() {
  writeLocalCart([]);
}
