import type { BookingDetailsData } from "@/llm_brain/llmOutputStructures";

function bookingSummaryMd(b: BookingDetailsData): string {
  const lines = [
    `**Event:** ${b.booking_title}`,
    `**Contact:** ${b.booking_name} · ${b.phone_number} · ${b.email}`,
    `**Duration:** ${b.booking_duration} day(s) · **Guests:** ${b.total_guests}`,
    `**Budget:** ${b.budget} ${b.currency}`,
  ];
  for (const d of b.day_distribution) {
    lines.push(
      `**Day ${d.day_number}** ${d.hall_name} (${d.start_time}–${d.end_time}) · headcount ${d.expected_head_count}`,
    );
    if (d.special_requirements.length) {
      lines.push(`- Special: ${d.special_requirements.join(", ")}`);
    }
    for (const f of d.food_requirements) {
      lines.push(
        `- ${f.food_title}: ${f.dishes.join(", ")} | allergies: ${f.allergies.join(", ") || "none"} | ${f.notes}`,
      );
    }
  }
  return lines.join("\n");
}

/**
 * Map bookingDetails + UI context → Proposales `POST /v3/proposals` body (File Plan + Implementation contracts).
 * Block shape may need adjustment against live OpenAPI.
 */
export function buildCreateProposalBody(
  companyId: number,
  language: string,
  booking: BookingDetailsData,
  userQuery: string,
  productRows: unknown[],
): Record<string, unknown> {
  const title_md = booking.booking_title?.trim() || "Event proposal";
  const description_md = [`### Requirements`, userQuery, `### Extracted summary`, bookingSummaryMd(booking)].join(
    "\n\n",
  );
  const email = booking.email?.trim() || "unknown@example.com";

  return {
    company_id: companyId,
    language,
    creator_email: email,
    contact_email: email,
    background_image: {},
    background_video: {},
    title_md,
    description_md,
    recipient: booking.email?.trim() ? { email: booking.email.trim() } : {},
    data: {
      source: "rfp_pipeline",
      user_query: userQuery,
      selected_product_ids: productRows.map((p) => (p as { product_id?: number }).product_id),
      products: productRows,
      booking,
    },
    invoicing_enabled: false,
    tax_options: { mode: "standard" },
    blocks: [
      {
        type: "markdown",
        title_md: "Proposal overview",
        body_md: description_md,
      },
    ],
    attachments: [],
  };
}
