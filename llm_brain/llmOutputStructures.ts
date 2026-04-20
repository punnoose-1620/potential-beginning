import type { GenerationConfig, ObjectSchema } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";
import { parseJsonObject } from "@/llm_brain/json_utils";

export class ValueMissingError extends Error {
  constructor(field: string) {
    super(`ValueMissingError: ${field}`);
    this.name = "ValueMissingError";
  }
}

export class InvalidValueError extends Error {
  constructor(message: string) {
    super(`InvalidValueError: ${message}`);
    this.name = "InvalidValueError";
  }
}

export class EmailError extends Error {
  constructor() {
    super("EmailError: Invalid Email");
    this.name = "EmailError";
  }
}

export type FoodRequirementsData = {
  food_title: string;
  dishes: string[];
  allergies: string[];
  notes: string;
};

export type DayDistributionData = {
  day_number: number;
  hall_name: string;
  start_time: string;
  end_time: string;
  food_requirements: FoodRequirementsData[];
  special_requirements: string[];
  expected_head_count: number;
};

export type BookingDetailsData = {
  booking_title: string;
  booking_name: string;
  phone_number: string;
  email: string;
  booking_duration: number;
  total_guests: number;
  day_distribution: DayDistributionData[];
  budget: number;
  currency: string;
};

const DT_RE = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/;

function assertNonEmptyString(v: unknown, field: string): string {
  if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) {
    throw new ValueMissingError(field);
  }
  if (typeof v !== "string") throw new InvalidValueError(`${field} must be a string`);
  return v;
}

function assertNonEmptyArray<T>(v: unknown, field: string): T[] {
  if (!Array.isArray(v) || v.length === 0) throw new ValueMissingError(field);
  return v as T[];
}

function assertPositiveInt(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 1) {
    throw new ValueMissingError(field);
  }
  return Math.floor(v);
}

function assertNonNegativeInt(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
    throw new ValueMissingError(field);
  }
  return Math.floor(v);
}

export function verifyFoodRequirements(f: FoodRequirementsData): void {
  assertNonEmptyString(f.food_title, "food_title");
  assertNonEmptyArray(f.dishes, "dishes");
}

export function verifyDayTimes(d: DayDistributionData): void {
  assertNonEmptyString(d.start_time, "start_time");
  assertNonEmptyString(d.end_time, "end_time");
  if (!DT_RE.test(d.start_time)) throw new InvalidValueError("start_time format");
  if (!DT_RE.test(d.end_time)) throw new InvalidValueError("end_time format");
  const [ds, de] = [d.start_time, d.end_time].map(parseDdMmYyyyHms);
  if (de <= ds) throw new InvalidValueError("end_time must be after start_time");
}

function parseDdMmYyyyHms(s: string): number {
  const [datePart, timePart] = s.split(" ");
  const [dd, mm, yyyy] = datePart.split("-").map(Number);
  const [hh, mi, ss] = timePart.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, mi, ss).getTime();
}

export function verifyDayNonEmpty(d: DayDistributionData): void {
  assertPositiveInt(d.day_number, "day_number");
  assertNonEmptyString(d.hall_name, "hall_name");
  assertNonEmptyArray(d.food_requirements, "food_requirements");
  assertNonNegativeInt(d.expected_head_count, "expected_head_count");
}

export function verifyBookingNonEmpty(b: BookingDetailsData): void {
  assertNonEmptyString(b.booking_title, "booking_title");
  assertNonEmptyString(b.booking_name, "booking_name");
  assertNonEmptyString(b.phone_number, "phone_number");
  assertNonEmptyString(b.email, "email");
  assertPositiveInt(b.booking_duration, "booking_duration");
  assertPositiveInt(b.total_guests, "total_guests");
  assertNonEmptyArray(b.day_distribution, "day_distribution");
  assertNonNegativeInt(b.budget, "budget");
  assertNonEmptyString(b.currency, "currency");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function verifyEmail(email: string): void {
  if (!EMAIL_RE.test(email)) throw new EmailError();
}

/** `getDescription()`-style string for `bookingDetails` (File Plan §2). */
export function getBookingDetailsDescriptionText(): string {
  return JSON.stringify(
    {
      booking_title: "string",
      booking_name: "string",
      phone_number: "string",
      email: "string",
      booking_duration: "number (days)",
      total_guests: "number",
      day_distribution: [
        {
          day_number: "number (1-based day index)",
          hall_name: "string",
          start_time: "string DD-MM-YYYY hh:mm:ss",
          end_time: "string DD-MM-YYYY hh:mm:ss",
          food_requirements: [
            {
              food_title: "string (breakfast|lunch|dinner|other)",
              dishes: "string[]",
              allergies: "string[]",
              notes: "string",
            },
          ],
          special_requirements: "string[]",
          expected_head_count: "number",
        },
      ],
      budget: "number (minor units or whole amount per your convention)",
      currency: "string ISO 4217 e.g. EUR",
    },
    null,
    2,
  );
}

const foodSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    food_title: { type: SchemaType.STRING },
    dishes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    allergies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    notes: { type: SchemaType.STRING },
  },
  required: ["food_title", "dishes", "allergies", "notes"],
};

const daySchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    day_number: { type: SchemaType.INTEGER },
    hall_name: { type: SchemaType.STRING },
    start_time: { type: SchemaType.STRING },
    end_time: { type: SchemaType.STRING },
    food_requirements: { type: SchemaType.ARRAY, items: foodSchema },
    special_requirements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    expected_head_count: { type: SchemaType.INTEGER },
  },
  required: [
    "day_number",
    "hall_name",
    "start_time",
    "end_time",
    "food_requirements",
    "special_requirements",
    "expected_head_count",
  ],
};

/** `getGenerationConfig()` for `bookingDetails` root (nested schema). */
export function bookingDetailsGenerationConfig(): GenerationConfig {
  return {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        booking_title: { type: SchemaType.STRING },
        booking_name: { type: SchemaType.STRING },
        phone_number: { type: SchemaType.STRING },
        email: { type: SchemaType.STRING },
        booking_duration: { type: SchemaType.INTEGER },
        total_guests: { type: SchemaType.INTEGER },
        day_distribution: { type: SchemaType.ARRAY, items: daySchema },
        budget: { type: SchemaType.INTEGER },
        currency: { type: SchemaType.STRING },
      },
      required: [
        "booking_title",
        "booking_name",
        "phone_number",
        "email",
        "booking_duration",
        "total_guests",
        "day_distribution",
        "budget",
        "currency",
      ],
    },
  };
}

function coerceFood(raw: Record<string, unknown>): FoodRequirementsData {
  return {
    food_title: String(raw.food_title ?? ""),
    dishes: Array.isArray(raw.dishes) ? raw.dishes.map(String) : [],
    allergies: Array.isArray(raw.allergies) ? raw.allergies.map(String) : [],
    notes: String(raw.notes ?? ""),
  };
}

function coerceDay(raw: Record<string, unknown>): DayDistributionData {
  return {
    day_number: Number(raw.day_number ?? 0),
    hall_name: String(raw.hall_name ?? ""),
    start_time: String(raw.start_time ?? ""),
    end_time: String(raw.end_time ?? ""),
    food_requirements: Array.isArray(raw.food_requirements)
      ? raw.food_requirements.map((x) =>
          coerceFood(typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {}),
        )
      : [],
    special_requirements: Array.isArray(raw.special_requirements)
      ? raw.special_requirements.map(String)
      : [],
    expected_head_count: Number(raw.expected_head_count ?? 0),
  };
}

export function parseBookingDetailsFromText(text: string): BookingDetailsData {
  const j = parseJsonObject<Record<string, unknown>>(text);
  return {
    booking_title: String(j.booking_title ?? ""),
    booking_name: String(j.booking_name ?? ""),
    phone_number: String(j.phone_number ?? ""),
    email: String(j.email ?? ""),
    booking_duration: Number(j.booking_duration ?? 0),
    total_guests: Number(j.total_guests ?? 0),
    day_distribution: Array.isArray(j.day_distribution)
      ? j.day_distribution.map((x) =>
          coerceDay(typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {}),
        )
      : [],
    budget: Number(j.budget ?? 0),
    currency: String(j.currency ?? ""),
  };
}

export function verifyFullBooking(b: BookingDetailsData): void {
  verifyBookingNonEmpty(b);
  verifyEmail(b.email);
  for (const day of b.day_distribution) {
    verifyDayNonEmpty(day);
    verifyDayTimes(day);
    for (const fr of day.food_requirements) verifyFoodRequirements(fr);
  }
}

export function emptyBookingDetails(): BookingDetailsData {
  return {
    booking_title: "",
    booking_name: "",
    phone_number: "",
    email: "",
    booking_duration: 0,
    total_guests: 0,
    day_distribution: [],
    budget: 0,
    currency: "",
  };
}

/** LLM output: which catalog products fit the request (ids must be validated against candidates). */
export type ProductRecommendationData = {
  selected_product_ids: number[];
  notes?: string;
};

const productRecommendationRootSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    selected_product_ids: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.INTEGER },
    },
    notes: { type: SchemaType.STRING },
  },
  required: ["selected_product_ids"],
};

export function productRecommendationGenerationConfig(): GenerationConfig {
  return {
    responseMimeType: "application/json",
    responseSchema: productRecommendationRootSchema,
  };
}

export function parseProductRecommendationFromText(text: string): ProductRecommendationData {
  const j = parseJsonObject<Record<string, unknown>>(text);
  const raw = j.selected_product_ids;
  const selected_product_ids = Array.isArray(raw)
    ? raw.filter((x): x is number => typeof x === "number" && Number.isFinite(x)).map(Math.floor)
    : [];
  return {
    selected_product_ids,
    notes: typeof j.notes === "string" ? j.notes : undefined,
  };
}
