// lib/stock.ts

export async function getStockPrice(symbol: string): Promise<number> {
  const cleanSymbol = symbol.trim().toUpperCase();

  if (!cleanSymbol) return 0;

  try {
    const res = await fetch(`/api/stock?symbol=${encodeURIComponent(cleanSymbol)}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch stock price for ${cleanSymbol}`);
    }

    const data = await res.json();

    // Finnhub ส่งราคาปัจจุบันไว้ใน field 'c' (Current price)
    const price = Number(data?.c ?? 0);

    return isNaN(price) ? 0 : price;
  } catch (error) {
    console.error("getStockPrice error:", error);
    return 0;
  }
}