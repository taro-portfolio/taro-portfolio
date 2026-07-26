// app/api/stock/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing symbol" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    let cleanSymbol = symbol.trim().toUpperCase();

    // ดึงข้อมูลครั้งแรกจาก Finnhub
    let response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${apiKey}`,
      { cache: "no-store" }
    );

    let data = await response.json();

    // ถ้าเป็นหุ้นไทยแต่ลืมใส่ .BK ( Finnhub ส่งค่า c = 0 กลับมา) ให้ลองเติม .BK แล้วยิงซ้ำ
    if ((!data.c || data.c === 0) && !cleanSymbol.endsWith(".BK")) {
      const thSymbol = `${cleanSymbol}.BK`;
      const thResponse = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${thSymbol}&token=${apiKey}`,
        { cache: "no-store" }
      );
      const thData = await thResponse.json();

      if (thData && thData.c > 0) {
        data = thData;
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Finnhub API Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}