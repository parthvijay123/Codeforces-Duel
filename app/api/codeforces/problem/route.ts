
import { NextRequest, NextResponse } from "next/server";
import { load } from "cheerio";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");
    const index = searchParams.get("index");

    if (!contestId || !index) {
        return NextResponse.json({ error: "Missing contestId or index" }, { status: 400 });
    }

    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            redirect: 'follow'
        });

        if (!res.ok) throw new Error(`Failed to fetch from Codeforces: ${res.status}`);

        // Detect if we were redirected to login or home (soft block)
        if (res.url.includes('/enter') || res.url.includes('human-verification')) {
            throw new Error("Codeforces blocked the scraper (Cloudflare/Login Wall)");
        }

        const html = await res.text();
        const $ = load(html);

        // Try multiple selectors
        const statement = $(".problem-statement").html() || $(".ttypography").html(); // ttypography is sometimes the wrapper

        if (!statement) {
            console.error("Scraper: Statement not found. HTML length:", html.length);
            return NextResponse.json({ error: "Problem statement not found in page" }, { status: 404 });
        }

        // Extract sample tests
        const inputs: string[] = [];
        const outputs: string[] = [];

        $('.sample-test .input pre').each((_, el) => {
            // Use html() to preserve <br> as newlines if needed, but text() is safer usually.
            // CF creates generic <div class="test-example-line"> now often.
            // Let's rely on text for now, but handle <br> by replacing with newline before text.
            $(el).find('br').replaceWith('\n');
            inputs.push($(el).text().trim());
        });
        $('.sample-test .output pre').each((_, el) => {
            $(el).find('br').replaceWith('\n');
            outputs.push($(el).text().trim());
        });

        const samples = inputs.map((inp, i) => ({
            input: inp,
            output: outputs[i] || ''
        }));

        return NextResponse.json({ html: statement, samples });

    } catch (error: any) {
        console.error("Scrape Error:", error.message);
        return NextResponse.json({ error: error.message || "Failed to scrape problem" }, { status: 500 });
    }
}
