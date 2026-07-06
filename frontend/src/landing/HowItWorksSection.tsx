import { useScrollReveal } from "./useScrollReveal";

const steps = [
  {
    number: "01",
    title: "Create a Jar",
    description:
      "Choose an asset, then pick your unlock rule: a target date, a savings goal, or a combination of both.",
  },
  {
    number: "02",
    title: "Deposit Anytime",
    description:
      "Top up the jar whenever you like. Funds move into the contract's own custody the moment you deposit.",
  },
  {
    number: "03",
    title: "It Locks Itself",
    description:
      "The contract checks Soroban's ledger timestamp and the jar's balance directly — not a server, not a promise.",
  },
  {
    number: "04",
    title: "Withdraw When Unlocked",
    description:
      "Once your condition is verifiably met on-chain, the full balance returns to the owner in one transaction.",
  },
];

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <div
      ref={ref}
      className={`bg-background p-8 md:p-12 group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${(index % 2) * 120}ms` }}
    >
      <div className="flex items-start justify-between mb-10">
        <span className="text-[11px] tracking-[0.15em] text-muted-foreground/40">
          ({step.number})
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-extralight tracking-tight text-foreground mb-5 group-hover:translate-x-1 transition-transform duration-500">
        {step.title}
      </h3>
      <div className="w-8 h-px bg-border mb-5 group-hover:w-12 transition-all duration-500" />
      <p className="text-sm leading-[1.75] text-muted-foreground max-w-sm">{step.description}</p>
    </div>
  );
}

export function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal(0.05);

  return (
    <section id="how-it-works" className="px-6 py-28 md:px-12 lg:px-20 md:py-36">
      <div
        ref={ref}
        className={`mb-20 pb-6 border-b border-border transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          The Mechanism
        </p>
        <h2 className="text-3xl md:text-[2.75rem] font-extralight tracking-tight text-foreground">
          How It Works
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {steps.map((step, index) => (
          <StepCard key={step.number} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}
