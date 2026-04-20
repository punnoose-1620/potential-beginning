"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CompanyRow = {
  id: number;
  name: string;
  currency?: string;
};

type ProductRow = {
  product_id: number;
  variation_id: number;
  title: Record<string, unknown> | string;
  description: Record<string, unknown> | string;
};

function localeText(value: unknown, lang = "en"): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && lang in (value as object)) {
    const v = (value as Record<string, unknown>)[lang];
    if (typeof v === "string") return v;
  }
  if (value && typeof value === "object") {
    const first = Object.values(value as Record<string, unknown>).find((x) => typeof x === "string");
    if (typeof first === "string") return first;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function flattenForGrid(
  value: unknown,
  prefix = "",
  out: { key: string; value: string }[] = [],
): { key: string; value: string }[] {
  if (value === null || value === undefined) {
    out.push({ key: prefix || "(empty)", value: "—" });
    return out;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    out.push({ key: prefix || "value", value: String(value) });
    return out;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push({ key: prefix || "[]", value: "[]" });
      return out;
    }
    value.forEach((item, i) => {
      flattenForGrid(item, `${prefix}[${i}]`, out);
    });
    return out;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      out.push({ key: prefix || "{}", value: "{}" });
      return out;
    }
    for (const [k, v] of entries) {
      const next = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        flattenForGrid(v, next, out);
      } else if (Array.isArray(v)) {
        flattenForGrid(v, next, out);
      } else {
        out.push({
          key: next,
          value: typeof v === "string" ? v : JSON.stringify(v),
        });
      }
    }
    return out;
  }
  out.push({ key: prefix, value: String(value) });
  return out;
}

type GenerateResponse = {
  created?: boolean;
  reason?: string;
  recommended_products?: ProductRow[];
  proposal?: unknown;
  verificationRequired?: boolean;
  diagnostics?: unknown;
  error?: string;
};

function reasonMessage(reason: string | undefined): string {
  switch (reason) {
    case "no_candidates":
      return "No products matched your request keywords against the catalog. Try adding more specific services, catering, or venue terms.";
    case "llm_failed":
      return "Product selection could not run (Gemini unavailable or failed). Set GEMINI_API_KEY and try again.";
    case "llm_returned_empty":
      return "No products were selected as a good fit for this request. Refine your requirements or expand the catalog.";
    case "invalid_llm_output":
      return "The model returned product ids that did not match the catalog. Try again or check API responses.";
    default:
      return "Proposal was not created.";
  }
}

export function ProposalWorkspace() {
  const [companiesList, setCompaniesList] = useState<CompanyRow[]>([]);
  const [companiesReady, setCompaniesReady] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  const [companyId, setCompanyId] = useState<number | "">("");
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatePayload, setGeneratePayload] = useState<GenerateResponse | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/get-companies");
        const json = (await res.json()) as { data?: CompanyRow[] };
        if (!res.ok) throw new Error("Failed to load companies");
        if (!cancelled) {
          setCompaniesList(Array.isArray(json.data) ? json.data : []);
          setCompaniesError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCompaniesError(e instanceof Error ? e.message : "Companies fetch failed");
          setCompaniesList([]);
        }
      } finally {
        if (!cancelled) setCompaniesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const queryTrimmed = query.trim();
  const canGenerate =
    companyId !== "" && queryTrimmed.length >= 50 && !generateLoading;

  const proposalForDisplay = useMemo(() => {
    if (!generatePayload || typeof generatePayload !== "object") return null;
    const p = generatePayload as GenerateResponse;
    const proposal = p.proposal;
    if (proposal && typeof proposal === "object" && "data" in (proposal as object)) {
      return (proposal as { data: unknown }).data;
    }
    return proposal ?? null;
  }, [generatePayload]);

  const resultRows = useMemo(() => {
    if (proposalForDisplay === null || proposalForDisplay === undefined) return [];
    return flattenForGrid(proposalForDisplay);
  }, [proposalForDisplay]);

  async function onGenerate() {
    setGenerateError(null);
    setGeneratePayload(null);
    if (companyId === "") return;
    setGenerateLoading(true);
    try {
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryTrimmed,
          company: companyId,
        }),
      });
      const json = (await res.json()) as GenerateResponse;
      setGeneratePayload(json);

      if (!res.ok) {
        const msg =
          typeof json.error === "string" ? json.error : `Request failed (${res.status})`;
        setGenerateError(msg);
        return;
      }

      if (json.created === false) {
        setGenerateError(null);
      }
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerateLoading(false);
    }
  }

  async function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchError(null);
    setSearchResults(null);
    if (!q) return;
    setSearchLoading(true);
    try {
      const path = `/api/search-proposal/${encodeURIComponent(q)}`;
      const res = await fetch(path);
      const json = await res.json();
      if (!res.ok) {
        const msg =
          typeof json.error === "string" ? json.error : `Search failed (${res.status})`;
        throw new Error(msg);
      }
      setSearchResults(json);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  const verificationRequired = Boolean(generatePayload?.verificationRequired);
  const created = generatePayload?.created;
  const skipReason = generatePayload?.reason;
  const recommended = generatePayload?.recommended_products ?? [];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-600">
          Configure{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800">
            PROPOSALES_API_KEY
          </code>{" "}
          and{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800">
            GEMINI_API_KEY
          </code>{" "}
          in{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800">
            .env.local
          </code>{" "}
          for live APIs; otherwise dummy data is used. Products are chosen automatically from your
          requirements.
        </p>
        <Link
          href="/legacy"
          className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
        >
          Open legacy RFP pipeline
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Proposal search</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Search previous proposals. Results appear below.
        </p>
        <form onSubmit={onSearchSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-zinc-800">
            Search
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keywords, title, uuid fragment…"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searchLoading ? "Searching…" : "Search proposals"}
          </button>
        </form>
        {searchError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {searchError}
          </p>
        ) : null}
        {searchResults !== null ? (
          <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
            <h3 className="text-sm font-semibold text-zinc-800">Search results</h3>
            <pre className="mt-2 max-h-64 overflow-auto text-xs text-zinc-700 whitespace-pre-wrap break-words">
              {JSON.stringify(searchResults, null, 2)}
            </pre>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Select your company</h2>
        {!companiesReady ? (
          <p className="mt-3 text-sm text-zinc-500">Loading companies…</p>
        ) : companiesError ? (
          <p className="mt-3 text-sm text-red-600">{companiesError}</p>
        ) : (
          <select
            value={companyId === "" ? "" : String(companyId)}
            onChange={(e) => {
              const v = e.target.value;
              setCompanyId(v === "" ? "" : Number(v));
            }}
            className="mt-3 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2"
          >
            <option value="">Choose a company…</option>
            {companiesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">What are your requirements?</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Describe services, dates, guest count, catering, AV, budget, and any special needs. Products
          are matched automatically from this text (at least 50 characters after trim).
        </p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={8}
          placeholder="Describe dates, guest count, catering, AV, budget, and any special needs…"
          className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            Length: {queryTrimmed.length} / 50 minimum
          </span>
        </div>
        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={!canGenerate}
          className="mt-4 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generateLoading ? "Generating…" : "Fetch proposal"}
        </button>
        {generateError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {generateError}
          </p>
        ) : null}
        {generatePayload && created === false && !generateError ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {reasonMessage(skipReason)}
          </p>
        ) : null}
        {verificationRequired ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Booking extraction completed with verification required — please review the generated
            fields.
          </p>
        ) : null}
      </section>

      {recommended.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Recommended products</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Chosen for this request (deterministic keyword shortlist, then Gemini selection).
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommended.map((p) => (
              <li
                key={`${p.product_id}-${p.variation_id}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"
              >
                <div className="text-xs font-medium text-zinc-500">
                  Product #{p.product_id}
                  {p.variation_id ? ` · variation ${p.variation_id}` : ""}
                </div>
                <div className="mt-1 font-semibold text-zinc-900">{localeText(p.title)}</div>
                <div className="mt-1 text-sm text-zinc-600">{localeText(p.description)}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Generated proposal</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Shown when a proposal is created. Key fields in a grid; raw JSON below.
        </p>
        {!generatePayload ? (
          <p className="mt-6 text-sm text-zinc-500">No response yet.</p>
        ) : created === false ? (
          <p className="mt-6 text-sm text-zinc-500">
            No proposal was stored. Adjust your requirements or check diagnostics in the raw JSON.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {resultRows.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {resultRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                  >
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {row.key}
                    </div>
                    <div className="mt-1 break-words text-sm text-zinc-900">{row.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <details className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-800">
                Raw response JSON
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto text-xs text-zinc-700 whitespace-pre-wrap break-words">
                {JSON.stringify(generatePayload, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
