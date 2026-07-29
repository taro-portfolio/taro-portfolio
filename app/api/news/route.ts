import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "th";
    const symbol = searchParams.get("symbol") || "";

    const rssFeeds = [
      "https://finance.yahoo.com/news/rssindex",
      "https://www.cnbc.com/id/15839069/device/rss/rss.html",
    ];

    let allArticles: Array<{ title: string; link: string; pubDate: string; source: string }> = [];

    for (const feedUrl of rssFeeds) {
      try {
        const response = await fetch(feedUrl, { next: { revalidate: 300 } });
        const xmlText = await response.text();

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
          const itemContent = match[1];
          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
          const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);

          let title = titleMatch ? (titleMatch[1] || titleMatch[2]) : "";
          const link = linkMatch ? linkMatch[1] : "#";
          const pubDate = dateMatch ? dateMatch[1] : new Date().toISOString();

          if (title) {
            title = title
              .replace(/&amp;/g, "&")
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/It&apos;s/g, "It is");

            allArticles.push({
              title,
              link: link.trim(),
              pubDate,
              source: feedUrl.includes("cnbc") ? "CNBC Market" : "Yahoo Finance"
            });
          }
        }
      } catch (feedErr) {
        console.error("Error fetching feed:", feedErr);
      }
    }

    // 1. ค้นหาข่าวสำหรับส่วนล่าง (ตามหุ้นที่ผู้ใช้พิมพ์ค้นหา เช่น TSLA)
    let stockArticles = allArticles;
    if (symbol && symbol.trim() !== "") {
      const cleanSym = symbol.toUpperCase().trim();
      stockArticles = allArticles.filter(item => item.title.toUpperCase().includes(cleanSym));
      if (stockArticles.length === 0) {
        stockArticles = allArticles.slice(0, 4); // ถ้าไม่เจอ ให้แสดงข่าวล่าสุดสำรอง
      }
    } else {
      stockArticles = allArticles.slice(0, 4);
    }

    const formattedStockNews = stockArticles.map((item) => ({
      title: lang === "th" ? `รายงานด่วน: ${item.title}` : item.title,
      summary: lang === "th" ? `สรุปประเด็นสำคัญของหุ้นตัวนี้จากตลาด: ${item.title}` : item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source,
      sentiment: "เชิงบวก (Positive)",
      timeAgo: "Live"
    }));

    // 2. คัดเลือกข่าวสำหรับส่วนบน (ซ้าย: ทรัมป์/ภาษี | ขวา: เฟด/ดอกเบี้ย)
    let trumpNews = allArticles.find(item => 
      item.title.toLowerCase().includes("trump") || 
      item.title.toLowerCase().includes("tariff") || 
      item.title.toLowerCase().includes("tax") ||
      item.title.toLowerCase().includes("trade")
    ) || allArticles[0] || { title: "Trump Tariff & Trade Policy Updates", link: "#", source: "Global Trade Watch" };

    let fedNews = allArticles.find(item => 
      item.title.toLowerCase().includes("fed") || 
      item.title.toLowerCase().includes("rate") || 
      item.title.toLowerCase().includes("inflation") ||
      item.title.toLowerCase().includes("interest") ||
      item.title.toLowerCase().includes("bank")
    ) || allArticles[1] || { title: "Federal Reserve Interest Rate & Economic Outlook", link: "#", source: "Federal Reserve Desk" };

    const macroTop = [
      {
        headline: lang === "th" ? `🔥 เกาะติดนโยบายกำแพงภาษีและท่าทีทรัมป์ที่มีผลต่อตลาดหุ้น` : `🔥 Trump Tariff & Trade Impact`,
        summary: lang === "th" ? `ประเด็นสำคัญ: ${trumpNews.title}` : trumpNews.title,
        source: "Global Trade Watch",
        url: trumpNews.link,
        timeAgo: "Live Update",
        sentiment: lang === "th" ? "เชิงระมัดระวัง (Cautious)" : "Cautious"
      },
      {
        headline: lang === "th" ? `🏦 สัญญาณจากธนาคารกลางสหรัฐฯ (เฟด) กับทิศทางดอกเบี้ย` : `🏦 Federal Reserve Rate Outlook`,
        summary: lang === "th" ? `ประเด็นสำคัญ: ${fedNews.title}` : fedNews.title,
        source: "Federal Reserve Desk",
        url: fedNews.link,
        timeAgo: "Live Update",
        sentiment: lang === "th" ? "กลางๆ (Neutral)" : "Neutral"
      }
    ];

    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
      macro: macroTop,
      news: formattedStockNews
    });

  } catch (error: any) {
    console.error("API News Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}