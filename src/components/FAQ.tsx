"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do I need to install any software?",
    a: "No. VideoHarvester runs entirely in your web browser. Just paste a link and download — there is nothing to install.",
  },
  {
    q: "Does it work on a laptop or phone?",
    a: "Yes. It works on every device with a modern browser, including Windows, macOS, Linux, Android and iPhone.",
  },
  {
    q: "What video format do I get?",
    a: "Videos are saved as MP4, which plays on virtually any device or player. You can also extract audio as MP3.",
  },
  {
    q: "Are there any ads?",
    a: "The interface is clean and distraction-free, so you can grab your file quickly without pop-ups in the way.",
  },
  {
    q: "Can I watch the videos offline?",
    a: "Absolutely. Once a file is saved to your device you can watch or listen to it any time, with no internet needed.",
  },
  {
    q: "Is there a limit on how many I can download?",
    a: "No daily limit — download as many supported videos as you like, one link at a time.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20" id="faq">
      <div className="container-page max-w-3xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-500">Everything you need to know before you start.</p>
        </div>

        <div className="mt-10 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
          {FAQS.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="flex min-h-[44px] w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-slate-800">{item.q}</span>
                <svg
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {open === i && (
                <p
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className="px-5 pb-5 text-sm leading-relaxed text-slate-500"
                >
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
