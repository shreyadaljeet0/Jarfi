import { useScrollReveal } from "./useScrollReveal";

const stats = [
  { value: "4", label: "Unlock Conditions" },
  { value: "20", label: "Passing Contract Tests" },
  { value: "2+", label: "Supported Assets" },
];

export function AboutSection() {
  const { ref: headRef, isVisible: headVisible } = useScrollReveal(0.15);
  const { ref: bodyRef, isVisible: bodyVisible } = useScrollReveal(0.1);

  return (
    <section id="about" className="px-6 py-28 md:px-12 lg:px-20 md:py-36 bg-foreground text-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28">
        <div
          ref={headRef}
          className={`transition-all duration-1000 ${
            headVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-background/40 mb-8">
            About SaveJar
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extralight leading-[1.15] tracking-tight text-balance">
            We believe the best savings feature is one you can{"'"}t undo
          </h2>
        </div>

        <div
          ref={bodyRef}
          className={`flex flex-col justify-end gap-10 transition-all duration-1000 delay-200 ${
            bodyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex flex-col gap-6 max-w-lg">
            <p className="text-sm leading-[1.75] text-background/55">
              SaveJar is a Soroban smart contract on Stellar that holds your deposit in
              on-chain custody until a condition you set — a date, a savings goal, or both
              — is actually met. No admin key can release it early, and no server decides
              when it unlocks.
            </p>
            <p className="text-sm leading-[1.75] text-background/55">
              Every check runs against the Soroban ledger{"'"}s own timestamp, not a promise
              from a frontend. Deposit native XLM or any SEP-41 token — the contract
              treats them identically.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-10 border-t border-background/10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-extralight text-background tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[11px] tracking-[0.1em] uppercase text-background/35 mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
