type Block = {
  blockId: string;
  title: string;
  bodyMarkdown: string;
};

export function ProposalView({
  title,
  blocks,
}: {
  title: string;
  blocks: Block[];
}) {
  return (
    <article className="max-w-none text-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      {blocks.map((b) => (
        <section key={b.blockId} className="mt-6">
          <h3 className="text-lg font-medium">{b.title}</h3>
          <div className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {b.bodyMarkdown}
          </div>
        </section>
      ))}
    </article>
  );
}
