import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ดึงข้อมูลข่าวสารการเงินและหุ้นสหรัฐฯ ล่าสุดจาก RSS สำนักข่าวชั้นนำระดับโลก
    // ตัวอย่างใช้ Yahoo Finance RSS และ Financial News Feeds
    const rssFeeds = [
      "https://finance.yahoo.com/news/rssindex",
      "https://www.cnbc.com/id/15839069/device/rss/rss.html",
    ];

    let allArticles: Array<{ title: string; link: string; pubDate: string; source: string }> = [];

    for (const feedUrl of rssFeeds) {
      try {
        const response = await fetch(feedUrl, { next: { revalidate: 300 } }); // แคชข้อมูลไว้ 5 นาทีเพื่อความรวดเร็ว
        const xmlText = await response.text();

        // Parse XML แบบง่ายด้วย Regular Expression เพื่อดึงหัวข้อข่าวและลิงก์
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
          const itemContent = match[1];
          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
          const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);

          const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : "";
          const link = linkMatch ? linkMatch[1] : "#";
          const pubDate = dateMatch ? dateMatch[1] : new Date().toISOString();

          if (title) {
            allArticles.push({
              title: title.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
              link: link.trim(),
              pubDate,
              source: feedUrl.includes("cnbc") ? "CNBC Market" : "Yahoo Finance"
            });
          }
        }
      } catch (feedErr) {
        console.error("Error fetching individual feed:", feedErr);
      }
    }

    // เรียงลำดับข่าวตามเวลาล่าสุด
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // คัดเลือกข่าวเด่น 6 ประเด็นล่าสุด
    const latestNews = allArticles.slice(0, 6);

    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
      count: latestNews.length,
      news: latestNews.length > 0 ? latestNews : [
        {
          title: "Market Update: US Stocks React to Latest Federal Reserve Economic Data",
          link: "https://finance.yahoo.com",
          pubDate: new Date().toUTCString(),
          source: "Global Desk"
        }
      ]
    });

  } catch (error: any) {
    console.error("API News Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch live news" },
      { status: 500 }
    );
  }
}