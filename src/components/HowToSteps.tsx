const STEPS = [
  {
    title: "Copy the video link",
    text: "Open the app or website, tap Share (or the menu) and choose Copy Link.",
  },
  {
    title: "Open VideoHarvester",
    text: "Come back to this page in any browser on your phone or computer.",
  },
  {
    title: "Paste the URL",
    text: "Drop the link into the search box at the top and press Download.",
  },
  {
    title: "Choose format & quality",
    text: "Select MP4 video or MP3 audio and the resolution you want to keep.",
  },
  {
    title: "Save to your device",
    text: "The file downloads straight to your device's folder — ready to watch offline.",
  },
];

export default function HowToSteps() {
  return (
    <section className="py-16 sm:py-20" id="how-to">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Download in 5 Simple Steps
          </h2>
          <p className="mt-3 text-slate-500">
            No software, no account — just copy, paste and save.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl bg-slate-50 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
