"use client";

import { useState } from "react";
import { RfpForm } from "@/components/RfpForm";
import { RetrievalResults } from "@/components/RetrievalResults";
import { ProposalPlanView } from "@/components/ProposalPlan";
import { ProposalView } from "@/components/ProposalView";
import { EvaluationScores } from "@/components/EvaluationScores";

type ApiResult = {
  extracted: { summary: string; guestCount: number | null };
  retrievalHits: { score: number; productId: string; textPreview: string }[];
  plan: {
    notes: string | null;
    blocks: {
      id: string;
      title: string;
      intent: string;
      productIds: string[];
    }[];
  };
  draft: {
    title: string;
    blocks: {
      blockId: string;
      title: string;
      bodyMarkdown: string;
    }[];
  };
  proposalId: string | null;
  selfReview: { gaps: string[]; suggestions: string[] };
  evaluation: {
    overall: number;
    summary: string;
    dimensions: {
      name: string;
      score: number;
      max: number;
      rationale: string;
    }[];
  };
  warnings: string[];
};

export function PipelineSteps() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResult | null>(null);

  async function run(rfpText: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/rfp/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfpText }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? res.statusText);
        return;
      }
      setData(json as ApiResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-10">
      <RfpForm onSubmit={run} disabled={loading} />

      {error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {data?.warnings.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <div className="font-medium">Warnings</div>
          <ul className="mt-1 list-disc pl-5">
            {data.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data ? (
        <>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Extracted requirements
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {data.extracted.summary}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Guest count: {data.extracted.guestCount ?? "—"}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Retrieval
            </h2>
            <div className="mt-2">
              <RetrievalResults hits={data.retrievalHits} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Plan
            </h2>
            <div className="mt-2">
              <ProposalPlanView
                notes={data.plan.notes}
                blocks={data.plan.blocks}
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Generated proposal
            </h2>
            {data.proposalId ? (
              <p className="text-sm text-zinc-500">
                Proposales proposal id:{" "}
                <code className="text-zinc-800 dark:text-zinc-200">
                  {data.proposalId}
                </code>
              </p>
            ) : null}
            <div className="mt-4">
              <ProposalView
                title={data.draft.title}
                blocks={data.draft.blocks}
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Self-review
            </h2>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Gaps
                </h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600">
                  {data.selfReview.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Suggestions
                </h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600">
                  {data.selfReview.suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Evaluation
            </h2>
            <div className="mt-2">
              <EvaluationScores
                overall={data.evaluation.overall}
                summary={data.evaluation.summary}
                dimensions={data.evaluation.dimensions}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
