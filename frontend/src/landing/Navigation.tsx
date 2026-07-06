import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Unlock Types", href: "#unlock-types" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Get Started", href: "#get-started" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 60);
      setHidden(currentY > lastScrollY && currentY > 400);
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        hidden && !isOpen ? "-translate-y-full" : "translate-y-0"
      } ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-transparent"}`}
    >
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <a
          href="#top"
          className={`text-xs font-medium tracking-[0.3em] uppercase transition-colors duration-500 ${
            scrolled ? "text-foreground" : "text-background"
          }`}
        >
          SaveJar
        </a>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-[11px] tracking-[0.15em] uppercase transition-colors duration-500 hover:opacity-100 ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-background/60 hover:text-background"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden transition-colors duration-500 ${
            scrolled || isOpen ? "text-foreground" : "text-background"
          }`}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        } bg-background`}
      >
        <div className="flex flex-col px-6 py-10 gap-6">
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-2xl font-light tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-300"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
