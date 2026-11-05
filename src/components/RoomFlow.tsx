"use client";

import { useState } from "react";
import { ROOM_STEPS, buildSet, type RoomAnswers } from "@/data/catalog";
import { usePlayer } from "./PlayerProvider";

export default function RoomFlow() {
  const { playSet } = usePlayer();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<RoomAnswers>({});
  const [done, setDone] = useState(false);

  const total = ROOM_STEPS.length;

  const choose = (value: string) => {
    const s = ROOM_STEPS[step];
    const next = { ...answers, [s.id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      const set = buildSet(next);
      playSet(set, 0);
      setDone(true);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
  };

  if (done) {
    const n = buildSet(answers).length;
    return (
      <div className="rounded-3xl bg-[color:var(--bg-elevated)] p-8 text-center sm:p-12">
        <div className="eq mx-auto mb-4 inline-flex"><span /><span /><span /><span /></div>
        <h3 className="t-headline">Your set is playing.</h3>
        <p className="mx-auto mt-2 max-w-md t-sub">
          {n} songs queued, each starting at its best part and crossfading into the next.
          Tap <b className="text-ink">Open set</b> in the bar below to see the queue, tune the
          crossfade, or drop in a request.
        </p>
        <button onClick={reset} className="btn btn-ghost mt-5">Start over</button>
      </div>
    );
  }

  const s = ROOM_STEPS[step];
  return (
    <div className="rounded-3xl bg-[color:var(--bg-elevated)] p-8 sm:p-12">
      <div className="mb-6 flex items-center gap-2">
        {ROOM_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i <= step ? "var(--accent)" : "var(--hairline)" }}
          />
        ))}
      </div>
      <p className="t-eyebrow">Step {step + 1} of {total}</p>
      <h3 className="mt-2 t-headline">{s.question}</h3>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {s.options.map((o) => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className="card group flex flex-col items-start gap-3 border border-black/5 p-6 text-left"
          >
            <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{o.emoji}</span>
            <span className="text-[1.05rem] font-semibold">{o.label}</span>
          </button>
        ))}
      </div>
      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="btn btn-ghost mt-6 !px-0">← Back</button>
      )}
    </div>
  );
}
