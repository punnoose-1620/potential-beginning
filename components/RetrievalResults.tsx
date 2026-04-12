type Hit = { score: number; productId: string; textPreview: string };

export function RetrievalResults({ hits }: { hits: Hit[] }) {
  if (hits.length === 0) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300">
        No retrieval hits — add products to your Proposales library or check API
        keys.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {hits.map((h, i) => (
        <li
          key={`${h.productId}-${i}`}
          className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="font-medium text-zinc-800 dark:text-zinc-100">
            #{i + 1} · {h.productId}{" "}
            <span className="text-zinc-500">({h.score.toFixed(3)})</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
            {h.textPreview}
          </p>
        </li>
      ))}
    </ul>
  );
}
