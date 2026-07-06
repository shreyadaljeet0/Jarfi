import { CONTRACT_ID } from "../lib/config";

const footerLinks = [
  { label: "Unlock Types", href: "#unlock-types" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Get Started", href: "#get-started" },
];

const externalLinks = [
  { label: "Stellar Expert", href: `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}` },
  { label: "Freighter Wallet", href: "https://freighter.app" },
  { label: "Stellar Docs", href: "https://developers.stellar.org" },
];

export function Footer() {
  return (
    <footer className="px-6 py-16 md:px-12 lg:px-20 border-t border-border">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
        <div className="md:col-span-5">
          <a href="#top" className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
            SaveJar
          </a>
          <p className="text-sm leading-[1.75] text-muted-foreground mt-5 max-w-xs">
            A time-locked savings jar on Stellar Soroban — commitment-device savings, enforced
            entirely on-chain.
          </p>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground/50 mb-5">
            Navigation
          </p>
          <div className="flex flex-col gap-3">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 md:col-start-11">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground/50 mb-5">
            Resources
          </p>
          <div className="flex flex-col gap-3">
            {externalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-8 border-t border-border gap-4">
        <p className="text-[11px] tracking-[0.1em] text-muted-foreground/50">
          SaveJar — testnet demo, not for real funds.
        </p>
        <p className="text-[11px] tracking-[0.1em] text-muted-foreground/50">Built on Stellar Soroban</p>
      </div>
    </footer>
  );
}
