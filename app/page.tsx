import { ProposalWorkspace } from "@/components/ProposalWorkspace";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 font-sans text-zinc-900">
      <header className="border-b border-zinc-200/80 bg-white/90 px-6 py-10 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Proposales · Proposal workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Select a company and products, describe your event, then generate a proposal. Search
            past proposals from the bar at the top.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <ProposalWorkspace />
      </main>
    </div>
  );
}
