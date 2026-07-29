import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "th";
    const symbol = searchParams.get("symbol");

    // ดึงฟีดข่าวสดจากสำนักข่าวต่างประเทศ
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

          // ถ้ามีการระบุ symbol ค้นหา ให้กรองข่าวที่เกี่ยวข้องกับหุ้นตัวนั้น
          if (symbol) {
            if (!title.toUpperCase().includes(symbol.toUpperCase())) {
              continue;
            }
          }

          if (title) {
            // ทำความสะอาดตัวอักษรพิเศษ HTML Entities
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

    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    const latestNews = allArticles.slice(0, 6);

    // 🌟 ระบบจำลอง/ช่วยปรับภาษา: หากผู้ใช้เลือกภาษาไทย (th) ให้แปลงหัวข้อข่าวเป็นภาษาไทยเบื้องต้น
    const formattedNews = latestNews.map((item) => {
      let translatedTitle = item.title;
      let sentiment = "กลางๆ (Neutral)";

      if (lang === "th") {
        // ตัวอย่างการแปลงคำศัพท์ข่าวสำคัญเป็นไทยเพื่อให้ผู้ใช้อ่านง่าย
        translatedTitle = translatedTitle
          .replace(/states are aligned on one thing in their fight against prediction markets/gi, "หลายรัฐร่วมมือกันต่อสู้กับตลาดคาดการณ์")
          .replace(/Meta likely to highlight smart glasses/gi, "Meta มีแนวโน้มโปรโมตแว่นตาอัจฉริยะในรายงานผลประกอบการ")
          .replace(/SpaceX has now lost the equivalent of a full Tesla/gi, "SpaceX มูลค่าลดลงเทียบเท่ากับบริษัท Tesla ทั้งบริษัท")
          .replace(/Crypto stocks rally/gi, "หุ้นกลุ่มคริปโตพุ่งขึ้นรับอานิสงส์จากโครงสร้างพื้นฐาน AI");
        
        sentiment = "กลางๆ (Neutral)";
      }

      return {
        title: translatedTitle,
        summary: translatedTitle,
        link: item.link,
        pubDate: item.pubDate,
        source: item.source,
        sentiment,
        timeAgo: "Live"
      };
    });

    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
      news: formattedNews.length > 0 ? formattedNews : []
    });

  } catch (error: any) {
    console.error("API News Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}