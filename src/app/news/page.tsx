import NewsFeed from "@/components/NewsFeed";

export const metadata = {
  title: "Industry updates — AutoApply",
  description: "Live AI, technology, hiring and world business updates. Save what matters to your career.",
};

export default function NewsPage() {
  return (
    <main className="pb-16">
      <section className="border-b border-slate-200 bg-white">
        <div className="section py-12">
          <p className="eyebrow">Stay current</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            What&apos;s happening in tech, AI and the job market
          </h1>
          <p className="prose-muted mt-4 max-w-2xl">
            Live headlines from across the web, grouped by the topics that affect your career. Save anything worth
            revisiting — your saved list is stored to your workspace so you can come back to it before an interview.
          </p>
        </div>
      </section>
      <div className="section pt-8">
        <NewsFeed />
      </div>
    </main>
  );
}
