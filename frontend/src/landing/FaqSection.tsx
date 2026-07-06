import { useScrollReveal } from "./useScrollReveal";

const entries = [
  {
    index: "Q1",
    title: "Is my money actually safe?",
    tag: "Security",
    answer:
      "Deposits are held in the SaveJar contract's own custody, not by any person or admin key. The full balance can only ever move to the jar's owner, and only once the on-chain unlock condition is verifiably met.",
  },
  {
    index: "Q2",
    title: "What assets can I deposit?",
    tag: "Assets",
    answer:
      "Native XLM works out of the box. The contract also accepts any SEP-41 token contract address — including USDC on Stellar — with the same deposit and withdraw flow.",
  },
  {
    index: "Q3",
    title: "What if I miss my target date or goal?",
    tag: "Design",
    answer:
      "Nothing happens — there's no penalty or liquidation. The jar simply stays locked until the condition you set is met, however long that takes.",
  },
  {
    index: "Q4",
    title: "Is this ready for mainnet funds?",
    tag: "Status",
    answer:
      "Not yet. SaveJar is currently a Stellar Testnet demo. Don't send real funds to it.",
  },
];

function FaqEntry({ entry, index }: { entry: (typeof entries)[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={`flex flex-col md:flex-row md:items-start justify-between py-7 md:py-8 gap-3 md:gap-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-10 flex-1">
        <span className="text-[11px] tracking-[0.15em] text-muted-foreground/50 shrink-0 w-24 tabular-nums">
          {entry.index}
        </span>
        <div>
          <h3 className="text-base md:text-lg font-light tracking-tight text-foreground">
            {entry.title}
          </h3>
          <p className="text-sm leading-[1.75] text-muted-foreground max-w-xl mt-3">
            {entry.answer}
          </p>
        </div>
      </div>
      <span className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground/40 shrink-0">
        {entry.tag}
      </span>
    </div>
  );
}

export function FaqSection() {
  const { ref, isVisible } = useScrollReveal(0.05);

  return (
    <section id="faq" className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <div
        ref={ref}
        className={`mb-20 pb-6 border-b border-border transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Questions & Answers
        </p>
        <h2 className="text-3xl md:text-[2.75rem] font-extralight tracking-tight text-foreground">
          FAQ
        </h2>
      </div>

      <div className="divide-y divide-border">
        {entries.map((entry, index) => (
          <FaqEntry key={entry.title} entry={entry} index={index} />
        ))}
      </div>
    </section>
  );
}
