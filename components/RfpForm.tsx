"use client";

import { useState } from "react";

type Props = {
  onSubmit: (rfpText: string) => void;
  disabled?: boolean;
};

export function RfpForm({ onSubmit, disabled }: Props) {
  const [text, setText] = useState("");

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text.trim());
      }}
    >
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        RFP text
      </label>
      <textarea
        className="min-h-[180px] w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        placeholder="Paste an RFP…"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Run pipeline
      </button>
    </form>
  );
}
