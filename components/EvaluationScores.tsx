type Dim = {
  name: string;
  score: number;
  max: number;
  rationale: string;
};

export function EvaluationScores({
  overall,
  summary,
  dimensions,
}: {
  overall: number;
  summary: string;
  dimensions: Dim[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Overall: {overall}
        <span className="text-base font-normal text-zinc-500"> / 100</span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>
      <ul className="flex flex-col gap-2">
        {dimensions.map((d) => (
          <li
            key={d.name}
            className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="font-medium">
              {d.name}{" "}
              <span className="text-zinc-500">
                {d.score}/{d.max}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {d.rationale}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
