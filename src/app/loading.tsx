export default function AppLoading() {
  return (
    <main className="min-h-[70vh] bg-slate-50 py-10" aria-label="Loading page">
      <div className="section animate-pulse">
        <div className="h-3 w-24 rounded-full bg-indigo-100" />
        <div className="mt-4 h-9 w-full max-w-md rounded-xl bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-slate-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-4 h-7 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-64 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
