type Block = {
  id: string;
  title: string;
  intent: string;
  productIds: string[];
};

export function ProposalPlanView({
  notes,
  blocks,
}: {
  notes: string | null;
  blocks: Block[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {notes ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{notes}</p>
      ) : null}
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        {blocks.map((b) => (
          <li key={b.id}>
            <span className="font-medium">{b.title}</span>
            <span className="text-zinc-500"> — {b.intent}</span>
            {b.productIds.length > 0 ? (
              <div className="mt-1 text-xs text-zinc-500">
                Products: {b.productIds.join(", ")}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
