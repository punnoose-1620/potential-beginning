import { PipelineSteps } from "@/components/PipelineSteps";
import Link from "next/link";

export default function LegacyPipelinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Legacy · RFP pipeline</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Retrieval → plan → proposal → self-review → evaluation.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
          >
            ← Proposal workspace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <PipelineSteps />
      </main>
    </div>
  );
}
