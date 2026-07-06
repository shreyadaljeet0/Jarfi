import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "./useScrollReveal";
import { CONTRACT_ID } from "../lib/config";

export function GetStartedSection() {
  const { ref: headRef, isVisible: headVisible } = useScrollReveal(0.15);
  const { ref: bodyRef, isVisible: bodyVisible } = useScrollReveal(0.1);

  return (
    <section id="get-started" className="px-6 py-28 md:px-12 lg:px-20 md:py-36 bg-foreground text-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28">
        <div
          ref={headRef}
          className={`transition-all duration-1000 ${
            headVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-background/40 mb-8">
            Get Started
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extralight leading-[1.15] tracking-tight text-balance">
            Ready to lock in
            <br />
            your first jar?
          </h2>
          <div className="mt-10">
            <Link
              to="/app"
              className="group inline-flex items-center gap-3 text-sm tracking-wide text-background/60 hover:text-background transition-colors duration-500"
            >
              <span className="border-b border-background/20 pb-0.5 group-hover:border-background/60 transition-colors duration-500">
                Launch the app
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        <div
          ref={bodyRef}
          className={`flex flex-col justify-end transition-all duration-1000 delay-200 ${
            bodyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-background/35 mb-5">
                Contract
              </p>
              <p className="text-sm leading-[1.75] text-background/55 break-all">{CONTRACT_ID}</p>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-background/55 mt-4 inline-block hover:text-background transition-colors duration-300"
              >
                View on Stellar Expert →
              </a>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-background/35 mb-5">
                Network
              </p>
              <p className="text-sm leading-[1.75] text-background/55">
                Stellar Testnet
                <br />
                Soroban Smart Contracts
              </p>
              <p className="text-sm text-background/55 mt-4">
                Requires the Freighter wallet
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
