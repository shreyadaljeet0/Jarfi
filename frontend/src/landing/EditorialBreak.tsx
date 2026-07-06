import { useScrollReveal } from "./useScrollReveal";

export function EditorialBreak() {
  const { ref: imgRef, isVisible: imgVisible } = useScrollReveal(0.15);
  const { ref: quoteRef, isVisible: quoteVisible } = useScrollReveal(0.2);

  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
        <div
          ref={imgRef}
          className={`lg:col-span-7 overflow-hidden transition-all duration-1000 ${
            imgVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <img
            src="/landing/editorial-jar.jpg"
            alt="A sealed savings jar holding coins until its on-chain unlock condition is met"
            className="w-full aspect-[16/10] object-cover grayscale hover:grayscale-0 transition-all duration-1000"
          />
        </div>
        <div
          ref={quoteRef}
          className={`lg:col-span-4 lg:col-start-9 transition-all duration-1000 delay-200 ${
            quoteVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="w-10 h-px bg-foreground/20 mb-8" />
          <blockquote className="text-xl md:text-2xl lg:text-[1.65rem] font-extralight leading-[1.35] tracking-tight text-foreground text-balance">
            {'"'}The best way to save is to make spending impossible until you{"'"}ve earned the right to.{'"'}
          </blockquote>
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mt-8">
            The SaveJar Thesis
          </p>
        </div>
      </div>
    </section>
  );
}
