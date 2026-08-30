import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { socialInteractions, competitors } from "../../drizzle/socialOsSchema";
import { eq, desc, sql } from "drizzle-orm";
import ZAI from "z-ai-web-dev-sdk";

// Register SocialHub API routes
export function registerSocialHubRoutes(app: Express) {
  // ===== Social Listening / Mentions =====
  app.get("/api/socialhub/mentions", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json({ mentions: [], summary: null });
      
      const userId = 1; // dev user
      const allMentions = await db.select().from(socialInteractions)
        .where(eq(socialInteractions.userId, userId))
        .orderBy(desc(socialInteractions.receivedAt))
        .limit(50);
      
      const total = allMentions.length;
      const positive = allMentions.filter(m => (m as any).kind === "positive").length;
      const negative = allMentions.filter(m => (m as any).kind === "negative").length;
      const neutral = allMentions.filter(m => (m as any).kind === "question" || (m as any).kind === "neutral").length;
      
      res.json({
        mentions: allMentions,
        summary: {
          total, positive, negative, neutral,
          positivePct: total > 0 ? Math.round((positive / total) * 100) : 0,
          negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
          neutralPct: total > 0 ? Math.round((neutral / total) * 100) : 0,
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/socialhub/mentions/scan", async (req: Request, res: Response) => {
    try {
      const { brandName, niche } = req.body;
      if (!brandName || !niche) return res.status(400).json({ error: "brandName e niche obrigatórios" });
      
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: "You are a social listening analyst. Generate realistic brand mentions with sentiment. Respond with STRICT JSON only." },
          { role: "user", content: `Gere 10 menções realistas da marca "${brandName}" (nicho: ${niche}) em redes sociais. Variar entre positivas, neutras e negativas. Responda SOMENTE com: {"mentions":[{"author":"Nome","handle":"@handle","content":"texto da menção","platform":"instagram|twitter|facebook|tiktok","sentiment":"positive|neutral|negative","reach":5000,"engagement":120}]}` }
        ],
        thinking: { type: "disabled" },
      });
      
      const raw = completion.choices[0]?.message?.content || "";
      // Strip markdown code fences if present
      let cleanRaw = raw.trim();
      if (cleanRaw.startsWith("```")) {
        cleanRaw = cleanRaw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      }
      // Find first { and last }
      const first = cleanRaw.indexOf("{");
      const last = cleanRaw.lastIndexOf("}");
      if (first !== -1 && last !== -1) {
        cleanRaw = cleanRaw.slice(first, last + 1);
      }
      let parsed;
      try { parsed = JSON.parse(cleanRaw); } catch { parsed = { mentions: [] }; }
      
      const db = await getDb();
      if (db) {
        for (const m of parsed.mentions || []) {
          await db.insert(socialInteractions).values({
            userId: 1,
            network: m.platform || "instagram",
            authorName: m.author || "Anônimo",
            authorHandle: m.handle || null,
            body: m.content || "",
            kind: m.sentiment || "neutral",
            status: "open",
            requiresHumanApproval: false,
          });
        }
      }
      
      res.json({ mentions: parsed.mentions || [], count: (parsed.mentions || []).length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== AI Image Generation =====
  app.post("/api/socialhub/media/generate", async (req: Request, res: Response) => {
    try {
      const { prompt, orientation = "square" } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt obrigatório" });
      
      const sizeMap: Record<string, string> = {
        square: "1024x1024",
        portrait: "768x1344",
        landscape: "1344x768",
        story: "720x1440",
        wide: "1440x720",
      };
      const size = sizeMap[orientation] || "1024x1024";
      
      const zai = await ZAI.create();
      const response = await zai.images.generations.create({
        prompt,
        size: size as any,
      });
      
      const imageBase64 = response.data[0]?.base64;
      if (!imageBase64) return res.status(500).json({ error: "Falha na geração" });
      
      const buffer = Buffer.from(imageBase64, "base64");
      const uploadsDir = `${process.cwd()}/uploads`;
      try { await Bun.write(uploadsDir + "/.gitkeep", ""); } catch {}
      const filename = `ai_${Date.now()}_${Math.random().toString(36).slice(2,8)}.png`;
      await Bun.write(`${uploadsDir}/${filename}`, buffer);
      
      res.json({ url: `/uploads/${filename}`, prompt, size });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== Integrations status =====
  app.get("/api/socialhub/integrations", async (req: Request, res: Response) => {
    res.json({ 
      integrations: [],
      available: ["instagram","facebook","linkedin","twitter","tiktok","youtube","google_my_business","google_analytics"]
    });
  });
}
