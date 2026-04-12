/**
 * Optional: install `tsx`, then from repo root:
 *   npx tsx scripts/seed-content.ts
 * Load env first (e.g. copy vars into shell or use dotenv).
 * Adjust payloads to match Proposales OpenAPI.
 */
import { createContent } from "../server_connect/content";

async function main() {
  const samples = [
    {
      title: "Executive boardroom (full day)",
      description:
        "Private boardroom for up to 14 guests, daylight, wired AV, coffee breaks.",
    },
    {
      title: "Gala dinner package (per guest)",
      description:
        "Three-course seated dinner, welcome drink, half wine package, staff ratio 1:10.",
    },
  ];

  for (const s of samples) {
    try {
      const res = await createContent(s);
      console.log("Created:", res);
    } catch (e) {
      console.error(e);
    }
  }
}

main();
