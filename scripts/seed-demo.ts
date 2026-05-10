/**
 * Investor Demo Seed Script
 * Creates 4 demo personas: free/pro/elite/admin
 * Usage: npx tsx scripts/seed-demo.ts
 *
 * WARNING: Never run against production DB.
 * Set DATABASE_URL in .env.local to a staging DB.
 */

import { PrismaClient } from "@prisma/client";
import { createHmac } from "node:crypto";

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function demoToken(email: string): string {
  const secret = process.env.SESSION_SECRET ?? "demo-secret-catalyst";
  return createHmac("sha256", secret).update(email + Date.now()).digest("hex").slice(0, 32);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  {
    email: "demo-free@catalystai.in",
    name: "Arjun Sharma",
    role: "USER" as const,
    plan: "FREE" as const,
    xp: 340,
    streak: 3,
    level: 2,
    conversations: [
      {
        topic: "Quant",
        title: "Percentages & Profit Loss",
        messages: [
          { role: "USER" as const, content: "How do I solve mixture and alligation problems quickly?" },
          { role: "ASSISTANT" as const, content: "Great question! The alligation rule states that the ratio of mixing two solutions equals the inverse ratio of their differences from the target concentration. Let me walk you through an example..." },
        ],
      },
    ],
    memories: [
      { summary: "User struggles with time-speed-distance problems — especially with relative speed concepts", relatedTopics: ["quant"] },
      { summary: "Prefers visual/tabular approach over formula derivation for LCM-HCF", relatedTopics: ["quant"] },
    ],
  },
  {
    email: "demo-pro@catalystai.in",
    name: "Priya Nair",
    role: "USER" as const,
    plan: "PRO" as const,
    xp: 4200,
    streak: 21,
    level: 8,
    conversations: [
      {
        topic: "VARC",
        title: "RC — Inference vs Conclusion",
        messages: [
          { role: "USER" as const, content: "I keep confusing inference and conclusion in RC. Can you explain with examples from actual CAT passages?" },
          { role: "ASSISTANT" as const, content: "This is one of the most common CAT traps! Here's the key: An **inference** must be **necessarily true** based on the passage, while a **conclusion** is a logical end-point the author is building towards..." },
          { role: "USER" as const, content: "That makes more sense. What about 'assumption' questions?" },
          { role: "ASSISTANT" as const, content: "Perfect follow-up. Assumptions are **unstated premises** the argument depends on. To identify them, negate the option — if negating it breaks the argument, it's an assumption..." },
        ],
      },
      {
        topic: "DILR",
        title: "Seating Arrangement — Circular",
        messages: [
          { role: "USER" as const, content: "I spent 12 minutes on a circular arrangement set and got 2/4. How should I approach these?" },
          { role: "ASSISTANT" as const, content: "The 12-minute trap is real! Here's the 2-minute triage rule: If after fixing the anchor and 1-2 absolute constraints you can't see at least one slot fully determined, skip and return..." },
        ],
      },
    ],
    memories: [
      { summary: "Weak in circular seating arrangements — tends to miscount rotational positions", relatedTopics: ["dilr"] },
      { summary: "Strong in Para-jumbles — scores 85%+ accuracy consistently", relatedTopics: ["varc"] },
      { summary: "Prefers 10-minute block strategy: 2-min read, 8-min attempt, then next set", relatedTopics: ["strategy"] },
      { summary: "Target: IIM Ahmedabad. Needs 99.5%ile. Currently at ~92 in mocks.", relatedTopics: ["general"] },
    ],
  },
  {
    email: "demo-elite@catalystai.in",
    name: "Rahul Kapoor",
    role: "USER" as const,
    plan: "ELITE" as const,
    xp: 18700,
    streak: 47,
    level: 15,
    conversations: [
      {
        topic: "Quant",
        title: "CAT 2024 Slot 2 Analysis — Quant",
        messages: [
          { role: "USER" as const, content: "I got 24 correct in Quant but left 6. My mock accuracy is 91%. Am I being too selective?" },
          { role: "ASSISTANT" as const, content: "Actually, 91% accuracy with 24 correct maps to approximately 98.2-98.7%ile in Quant. The risk/reward of attempting those 6 questionable ones at ~60% confidence would statistically *lower* your expected score due to negative marking. You're playing optimally." },
          { role: "USER" as const, content: "Perfect. What should my Quant target be for IIM B cutoff?" },
          { role: "ASSISTANT" as const, content: "IIM Bangalore's Quant cutoff has historically been 80-85%ile sectionally with 99%+ overall. Your 24/30 with high accuracy gives you ~98.5%ile Quant — that's comfortably above cutoff. Focus energy on VARC to push overall above 99.5." },
        ],
      },
    ],
    memories: [
      { summary: "Elite performer — consistent 97-99%ile in mocks. Ready for final 2-week sprint strategy.", relatedTopics: ["strategy"] },
      { summary: "Minor weak spot: Number Theory (Euler's theorem, Wilson's theorem application)", relatedTopics: ["quant"] },
      { summary: "VARC accuracy drops in long RC passages (750+ words) — needs skimming practice", relatedTopics: ["varc"] },
      { summary: "Optimal test strategy: DILR → Quant → VARC order works best for this user", relatedTopics: ["strategy"] },
      { summary: "Mock test dates: ION CBT 2 on 15th, Mindworkzz Open on 22nd — calibrate difficulty", relatedTopics: ["general"] },
    ],
  },
  {
    email: "demo-admin@catalystai.in",
    name: "Admin Demo",
    role: "ADMIN" as const,
    plan: "ELITE" as const,
    xp: 99999,
    streak: 365,
    level: 99,
    conversations: [],
    memories: [],
  },
];

// ─── Main seed ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding investor demo accounts...\n");

  const isDemoSafeDb = process.env.DATABASE_URL?.includes("localhost") ||
    process.env.DATABASE_URL?.includes("staging") ||
    process.env.DATABASE_URL?.includes("demo") ||
    process.env.ALLOW_DEMO_SEED === "true";

  if (!isDemoSafeDb) {
    console.error("❌ Refusing to seed: DATABASE_URL doesn't look like a dev/staging DB.");
    console.error("   Set ALLOW_DEMO_SEED=true to override.");
    process.exit(1);
  }

  for (const demoUser of DEMO_USERS) {
    console.log(`👤 Creating ${demoUser.plan} user: ${demoUser.email}`);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      create: {
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        xp: demoUser.xp,
        streak: demoUser.streak,
        level: demoUser.level,
      },
      update: {
        name: demoUser.name,
        role: demoUser.role,
        xp: demoUser.xp,
        streak: demoUser.streak,
        level: demoUser.level,
      },
    });

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: demoUser.plan,
        status: "ACTIVE",
      },
      update: {
        plan: demoUser.plan,
        status: "ACTIVE",
      },
    });

    // Create conversations + messages
    for (const conv of demoUser.conversations) {
      const existingConv = await prisma.conversation.findFirst({
        where: { userId: user.id, title: conv.title },
      });

      const conversation = existingConv ?? await prisma.conversation.create({
        data: {
          userId: user.id,
          topic: conv.topic,
          title: conv.title,
          createdAt: daysAgo(Math.floor(Math.random() * 30)),
        },
      });

      if (!existingConv) {
        for (const msg of conv.messages) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: msg.role,
              content: msg.content,
            },
          });
        }
      }
    }

    // Create memories
    for (const mem of demoUser.memories) {
      const existing = await prisma.memory.findFirst({
          where: { userId: user.id, summary: mem.summary },
      });
      if (!existing) {
        await prisma.memory.create({
          data: {
            userId: user.id,
              summary: mem.summary,
              relatedTopics: mem.relatedTopics,
            createdAt: daysAgo(Math.floor(Math.random() * 60)),
          },
        });
      }
    }

    console.log(`   ✅ Done — userId: ${user.id}`);
  }

  console.log("\n✅ Demo seed complete!");
  console.log("\nDemo login tokens:");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.plan.padEnd(5)} ${u.email}  token: ${demoToken(u.email)}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => void prisma.$disconnect());
