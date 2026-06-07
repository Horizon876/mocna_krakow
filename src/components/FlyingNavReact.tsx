import React, { useState, useEffect, useCallback, useRef } from "react";
import { HOME_SECTION_SCROLL } from "@data/site";
import { readCart } from "../scripts/cart";

const oNas = [
  { label: "O MOCnej!", href: "/#poznaj-mocna" },
  { label: "W mediach", href: "/#mocna-w-mediach" },
  { label: "Wolontariat", href: "/wolontariat" },
  { label: "Projekty", href: "/projekty" },
];

const oferta = [
  { label: "Szkolenia", href: "/szkolenia" },
  { label: "Catering", href: "/catering" },
];

const HOME_SECTIONS = Object.values(HOME_SECTION_SCROLL);
const NAV_OFFSET_PX = 72;

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

function parseNavHref(href: string): { path: string; hash: string } {
  const raw = href.split("?")[0];
  const [pathPart, hashPart] = raw.split("#");
  return {
    path: normalizePath(pathPart || "/"),
    hash: hashPart ? `#${hashPart}` : "",
  };
}

export default function FlyingNavReact() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeHomeSection, setActiveHomeSection] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [currentHash, setCurrentHash] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const isSklepPage = currentPath === "/sklep" || currentPath.startsWith("/sklep/");
  const shopCtaLabel = isSklepPage ? "Koszyk" : "Sklep";

  const updateScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 8);

    if (normalizePath(window.location.pathname) === "/") {
      let active: string | null = null;
      for (const { id, extraOffset } of HOME_SECTIONS) {
        const section = document.getElementById(id);
        if (!section) continue;
        if (section.getBoundingClientRect().top <= NAV_OFFSET_PX - (extraOffset as number) + 48) {
          active = id;
        }
      }
      setActiveHomeSection(active);
    } else {
      setActiveHomeSection(null);
    }
  }, []);

  useEffect(() => {
    setCurrentPath(normalizePath(window.location.pathname));
    setCurrentHash(window.location.hash);
    updateScroll();

    const handleScroll = () => updateScroll();
    const handleHashChange = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      setCurrentHash(window.location.hash);
      updateScroll();
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    
    // Listen to astro navigation if view transitions are used
    document.addEventListener("astro:after-swap", handleHashChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("astro:after-swap", handleHashChange);
    };
  }, [updateScroll]);

  useEffect(() => {
    const updateCart = () => setCartCount(readCart().reduce((sum, item) => sum + item.qty, 0));
    updateCart();

    const handleAdded = () => {
      setCartAdded(true);
      setCartBump(true);
      setTimeout(() => setCartAdded(false), 2200);
      setTimeout(() => setCartBump(false), 750);
      updateCart();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "mocna-cart") updateCart();
    };

    window.addEventListener("mocna:cart-updated", updateCart);
    window.addEventListener("mocna:cart-added", handleAdded);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("mocna:cart-updated", updateCart);
      window.removeEventListener("mocna:cart-added", handleAdded);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) setIsDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen]);

  const navLinkIsActive = useCallback((href: string) => {
    const { path: linkPath, hash: linkHash } = parseNavHref(href);

    if (linkPath !== currentPath) {
      if (linkPath === "/") return false;
      return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);
    }

    if (currentPath === "/") {
      if (linkHash) return activeHomeSection === linkHash.slice(1);
      return activeHomeSection === null;
    }

    return !linkHash || currentHash === linkHash;
  }, [currentPath, currentHash, activeHomeSection]);

  const isGroupActive = (items: { href: string }[]) => items.some(item => navLinkIsActive(item.href));

  const navLinkClass = (href: string) => {
    const active = navLinkIsActive(href);
    return `nav-link relative inline-flex items-center px-3 py-1.5 text-[13px] font-medium leading-none tracking-[-0.01em] transition-colors duration-200 ${
      active ? "text-[#2c5ea9]" : "text-[#6b6b6b] hover:text-[#333333]"
    }`;
  };

  const navGroupTriggerClass = (active: boolean) => {
    return `nav-link cursor-pointer gap-1 border-0 bg-transparent inline-flex items-center px-3 py-1.5 text-[13px] font-medium leading-none tracking-[-0.01em] transition-colors duration-200 ${
      active ? "text-[#2c5ea9]" : "text-[#6b6b6b] hover:text-[#333333]"
    }`;
  };

  const navUnderline = (active: boolean) => (
    <span className={`absolute inset-x-3 -bottom-px h-[1.5px] bg-[#2c5ea9] transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}></span>
  );

  const navCtaBase = "flex h-[2.125rem] w-auto shrink-0 items-center justify-center gap-1.5 box-border px-2.5 text-[13px] leading-none font-medium tracking-[-0.01em] transition-colors duration-200";

  const handleShopClick = (e: React.MouseEvent) => {
    if (isSklepPage) {
      e.preventDefault();
      setIsDrawerOpen(false);
      window.dispatchEvent(new CustomEvent("mocna:open-cart"));
    }
  };

  return (
    <>
      <header
        id="site-header"
        className={`fixed inset-x-0 top-0 z-50 overflow-visible transition-all duration-300 ${isScrolled ? "scrolled" : ""}`}
      >
        <div 
          id="nav-inner" 
          className="overflow-visible border-b border-[#333]/[0.07] bg-white transition-all duration-300"
          style={isScrolled ? { background: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(18px)", boxShadow: "0 2px 28px -6px rgba(51, 51, 51, 0.14)" } : {}}
        >
          <div className="shell">
            <nav className="flex h-16 items-center justify-between gap-4 overflow-visible sm:h-[4.5rem]" aria-label="Menu główne">
              <a href="/" className="group relative block shrink-0" aria-label="MOCna! – strona główna">
                <span className="block h-16 w-[8.5rem] sm:h-[4.5rem] sm:w-[11.5rem]" aria-hidden="true"></span>
                <img
                  src="/brand/logo-kolor.svg"
                  alt="MOCna!"
                  className="absolute left-0 top-1/2 w-auto max-w-none transition-opacity duration-300 group-hover:opacity-85 h-[6.5rem] sm:h-[8rem] -translate-y-[calc(50%-5px)] sm:-translate-y-[calc(50%-6px)] scale-x-110 origin-left"
                />
              </a>

              {/* Desktop links */}
              <ul className="hidden items-center gap-0.5 lg:flex list-none p-0 m-0" role="list">
                <li>
                  <a href="/" aria-current={navLinkIsActive("/") ? "page" : undefined} className={navLinkClass("/")}>
                    Strona główna
                    {navUnderline(navLinkIsActive("/"))}
                  </a>
                </li>
                <li className="relative" onMouseLeave={() => setOpenDropdown(null)}>
                  <button
                    type="button"
                    aria-expanded={openDropdown === "onas"}
                    className={navGroupTriggerClass(isGroupActive(oNas))}
                    onClick={() => setOpenDropdown(openDropdown === "onas" ? null : "onas")}
                    onMouseEnter={() => setOpenDropdown("onas")}
                  >
                    O nas
                    {navUnderline(isGroupActive(oNas))}
                    <svg className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "onas" ? "rotate-180" : ""}`} viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className={`absolute left-0 top-full z-50 min-w-[12rem] border border-[#333]/[0.07] bg-white py-1 transition-all duration-200 shadow-[0_18px_48px_-14px_rgba(51,51,51,0.2)] ${openDropdown === "onas" ? "opacity-100 pointer-events-auto mt-[6px]" : "opacity-0 pointer-events-none mt-2"}`} role="menu">
                    {oNas.map((item) => {
                      const active = navLinkIsActive(item.href);
                      return (
                        <a key={item.href} href={item.href} role="menuitem" className={`block px-3.5 py-2.5 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-150 border-l-2 ${active ? "text-[#2c5ea9] border-[#2c5ea9] bg-[#2c5ea9]/[0.07]" : "text-[#333333] border-transparent hover:bg-[#f4f4f3] hover:border-[#2c5ea9] hover:pl-[0.875rem]"}`}>
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                </li>
                <li className="relative" onMouseLeave={() => setOpenDropdown(null)}>
                  <button
                    type="button"
                    aria-expanded={openDropdown === "oferta"}
                    className={navGroupTriggerClass(isGroupActive(oferta))}
                    onClick={() => setOpenDropdown(openDropdown === "oferta" ? null : "oferta")}
                    onMouseEnter={() => setOpenDropdown("oferta")}
                  >
                    Oferta
                    {navUnderline(isGroupActive(oferta))}
                    <svg className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "oferta" ? "rotate-180" : ""}`} viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className={`absolute left-0 top-full z-50 min-w-[12rem] border border-[#333]/[0.07] bg-white py-1 transition-all duration-200 shadow-[0_18px_48px_-14px_rgba(51,51,51,0.2)] ${openDropdown === "oferta" ? "opacity-100 pointer-events-auto mt-[6px]" : "opacity-0 pointer-events-none mt-2"}`} role="menu">
                    {oferta.map((item) => {
                      const active = navLinkIsActive(item.href);
                      return (
                        <a key={item.href} href={item.href} role="menuitem" className={`block px-3.5 py-2.5 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-150 border-l-2 ${active ? "text-[#2c5ea9] border-[#2c5ea9] bg-[#2c5ea9]/[0.07]" : "text-[#333333] border-transparent hover:bg-[#f4f4f3] hover:border-[#2c5ea9] hover:pl-[0.875rem]"}`}>
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                </li>
                <li>
                  <a href="/wydarzenia" aria-current={navLinkIsActive("/wydarzenia") ? "page" : undefined} className={navLinkClass("/wydarzenia")}>
                    Wydarzenia{navUnderline(navLinkIsActive("/wydarzenia"))}
                  </a>
                </li>
                <li>
                  <a href="/kawiarnia" aria-current={navLinkIsActive("/kawiarnia") ? "page" : undefined} className={navLinkClass("/kawiarnia")}>
                    Kawiarnia{navUnderline(navLinkIsActive("/kawiarnia"))}
                  </a>
                </li>
                <li>
                  <a href="/kontakt" aria-current={navLinkIsActive("/kontakt") ? "page" : undefined} className={navLinkClass("/kontakt")}>
                    Kontakt{navUnderline(navLinkIsActive("/kontakt"))}
                  </a>
                </li>
              </ul>

              <div className="flex items-center gap-1.5">
                <div className="hidden items-center gap-1.5 sm:flex">
                  <a
                    href="/sklep"
                    onClick={handleShopClick}
                    style={{ transition: cartAdded ? "none" : "" }}
                    className={`${navCtaBase} border transition-all ${
                      cartAdded
                        ? "animate-[nav-cart-added_2.2s_cubic-bezier(0.22,0.55,0.1,1)] bg-[#ffde00] border-[#ffde00]"
                        : navLinkIsActive("/sklep")
                        ? "border-[#e6c800] bg-[#ffde00] text-[#333333]"
                        : "border-[#ffde00] bg-[#ffde00] text-[#333333] hover:border-[#e6c800] hover:bg-[#f5d500]"
                    }`}
                  >
                    {!isSklepPage ? (
                      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3.5 5h9l-1.25 7.5h-6.5L3.5 5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"></path>
                        <path d="M6 5c0-1.1.9-2 2-2s2 .9 2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"></path>
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 6h15l-1.5 9h-12z"></path>
                        <path d="M6 6l-1.2-3H2"></path>
                        <circle cx="9" cy="20" r="1"></circle>
                        <circle cx="18" cy="20" r="1"></circle>
                      </svg>
                    )}
                    <span>{shopCtaLabel}</span>
                    {isSklepPage && (
                      <span className={`inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] px-[0.3rem] ml-[0.15rem] rounded-full bg-[#2c5ea9] text-white text-[0.65rem] font-bold leading-none tracking-[-0.02em] ${cartBump ? "animate-[nav-cart-count-bump_0.75s_ease-out]" : ""}`}>
                        {cartCount}
                      </span>
                    )}
                  </a>

                  <a
                    href="/rezerwacja"
                    className={`${navCtaBase} font-semibold text-white hover:shadow-[0_5px_18px_-6px_rgba(44,94,169,0.45)] ${
                      navLinkIsActive("/rezerwacja") ? "bg-[#244d8f]" : "bg-[#2c5ea9] hover:bg-[#244d8f]"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="2" y="4.5" width="12" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                      <path d="M5.5 2.5v3M10.5 2.5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                      <path d="M2 7.5h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    Zarezerwuj stolik
                  </a>
                </div>

                {isSklepPage && (
                  <a
                    href="/sklep"
                    onClick={handleShopClick}
                    className="grid h-10 w-10 place-items-center rounded-none text-[#333333] bg-transparent transition-all duration-200 hover:bg-[#f4f4f4] sm:hidden relative"
                    aria-label="Koszyk"
                  >
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 6h15l-1.5 9h-12z"></path>
                      <path d="M6 6l-1.2-3H2"></path>
                      <circle cx="9" cy="20" r="1"></circle>
                      <circle cx="18" cy="20" r="1"></circle>
                    </svg>
                    <span className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-none border border-[#333333] bg-[#ffde00] px-1 text-[9px] font-bold text-[#333333] leading-none ${cartBump ? "animate-[nav-cart-count-bump_0.75s_ease-out]" : ""}`}>
                      {cartCount}
                    </span>
                  </a>
                )}

                <button
                  id="nav-burger"
                  className="grid h-10 w-10 place-items-center rounded-none text-[#333333] bg-transparent transition-all duration-200 hover:bg-[#f4f4f4] lg:hidden"
                  aria-label={isDrawerOpen ? "Zamknij menu" : "Otwórz menu"}
                  aria-expanded={isDrawerOpen}
                  aria-controls="mobile-drawer"
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  style={isDrawerOpen ? { backgroundColor: "#333333", color: "#ffffff", borderColor: "#333333" } : {}}
                >
                  <span className="flex flex-col items-center gap-[5px]" aria-hidden="true">
                    <span className={`block h-[2px] w-[20px] bg-currentColor rounded-none transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${isDrawerOpen ? "translate-y-[7px] rotate-45" : ""}`}></span>
                    <span className={`block h-[2px] w-[20px] bg-currentColor rounded-none transition-all duration-200 ${isDrawerOpen ? "opacity-0 scale-x-0" : ""}`}></span>
                    <span className={`block h-[2px] w-[20px] bg-currentColor rounded-none transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${isDrawerOpen ? "-translate-y-[7px] -rotate-45" : ""}`}></span>
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        className={`fixed inset-0 z-[60] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${isDrawerOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div className="absolute inset-0 bg-[#333333]/40 backdrop-blur-md transition-opacity duration-400" onClick={() => setIsDrawerOpen(false)}></div>
        
        <div className={`absolute inset-0 flex flex-col overflow-y-auto rounded-none border-0 bg-white px-6 pb-8 pt-0 shadow-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${isDrawerOpen ? "translate-y-0 opacity-100" : "-translate-y-[15px] opacity-0"}`}>
          <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-[#333]/[0.07] bg-transparent sm:h-[4.5rem]">
            <a href="/" onClick={() => setIsDrawerOpen(false)} className="group relative block shrink-0" aria-label="MOCna! – strona główna">
              <span className="block h-16 w-[8.5rem] sm:h-[4.5rem] sm:w-[11.5rem]" aria-hidden="true"></span>
              <img src="/brand/logo-kolor.svg" alt="MOCna!" className="absolute left-0 top-1/2 w-auto max-w-none transition-opacity duration-300 group-hover:opacity-85 h-[6.5rem] sm:h-[8rem] -translate-y-[calc(50%-5px)] sm:-translate-y-[calc(50%-6px)] scale-x-110 origin-left" />
            </a>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-none text-[#333333] bg-transparent transition-all duration-200 hover:bg-[#f4f4f4]"
              aria-label="Zamknij menu"
            >
              <svg className="h-5.5 w-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-start gap-7 pt-[35px]">
            <nav className="flex flex-col gap-4">
              {[
                { label: "Strona główna", href: "/", hoverClass: "hover:text-[#2c5ea9]" },
                { label: "Kawiarnia", href: "/kawiarnia", hoverClass: "hover:text-[#f39200]" },
                { label: "Wydarzenia", href: "/wydarzenia", hoverClass: "hover:text-[#fa8080]" },
                { label: "Kontakt", href: "/kontakt", hoverClass: "hover:text-[#00955e]" }
              ].map((link, idx) => {
                const active = navLinkIsActive(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`text-[2rem] font-bold leading-none tracking-tightest transition-all duration-300 sm:text-[2.5rem] ${active ? "text-[#2c5ea9]" : `text-[#333333] ${link.hoverClass}`} ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"} transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]`}
                    style={{ transitionDelay: `${0.1 + idx * 0.05}s` }}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            <hr className={`border-[#333]/[0.07] ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"} transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]`} style={{ transitionDelay: "0.3s" }} />

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className={`mb-4 px-1 text-[13px] font-bold uppercase tracking-[0.22em] text-[#6b6b6b] ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"} transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]`} style={{ transitionDelay: "0.35s" }}>O nas</p>
                <div className="flex flex-col gap-4">
                  {oNas.map((item, idx) => {
                    const active = navLinkIsActive(item.href);
                    return (
                      <a key={item.href} href={item.href} onClick={() => setIsDrawerOpen(false)} className={`text-[18px] transition-all hover:text-[#2c5ea9] ${active ? "text-[#2c5ea9] font-bold" : "text-[#4b4b4b] font-medium"} ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"} transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]`} style={{ transitionDelay: `${0.35 + idx * 0.02}s` }}>
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className={`mb-4 px-1 text-[13px] font-bold uppercase tracking-[0.22em] text-[#6b6b6b] ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"} transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]`} style={{ transitionDelay: "0.35s" }}>Oferta</p>
                <div className="flex flex-col gap-4">
                  {oferta.map((item, idx) => {
                    const active = navLinkIsActive(item.href);
                    return (
                      <a key={item.href} href={item.href} onClick={() => setIsDrawerOpen(false)} className={`text-[18px] transition-all hover:text-[#f39200] ${active ? "text-[#2c5ea9] font-bold" : "text-[#4b4b4b] font-medium"} ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"} transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]`} style={{ transitionDelay: `${0.35 + idx * 0.02}s` }}>
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 pb-4">
            <a
              href="/sklep"
              onClick={handleShopClick}
              className={`flex w-full items-center justify-center gap-2 rounded-none border-2 py-4 text-base font-bold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${navLinkIsActive("/sklep") ? "border-[#e6c800] bg-[#ffde00] text-[#333333] shadow-md" : "border-[#ffde00] bg-[#ffde00] text-[#333333] hover:-translate-y-0.5 hover:border-[#e6c800] hover:bg-[#f5d500] hover:shadow-lg"} ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"}`}
              style={{ transitionDelay: "0.4s" }}
            >
              {!isSklepPage ? (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.5 5h9l-1.25 7.5h-6.5L3.5 5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"></path>
                  <path d="M6 5c0-1.1.9-2 2-2s2 .9 2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 6h15l-1.5 9h-12z"></path>
                  <path d="M6 6l-1.2-3H2"></path>
                  <circle cx="9" cy="20" r="1"></circle>
                  <circle cx="18" cy="20" r="1"></circle>
                </svg>
              )}
              <span>{shopCtaLabel}</span>
              {isSklepPage && (
                <span className={`ml-1 inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] px-[0.3rem] rounded-full bg-[#2c5ea9] text-white text-[0.65rem] font-bold leading-none tracking-[-0.02em] ${cartBump ? "animate-[nav-cart-count-bump_0.75s_ease-out]" : ""}`}>
                  {cartCount}
                </span>
              )}
            </a>
            <a
              href="/rezerwacja"
              onClick={() => setIsDrawerOpen(false)}
              className={`flex w-full items-center justify-center rounded-none border-2 border-transparent py-4 text-base font-bold text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${navLinkIsActive("/rezerwacja") ? "bg-[#244d8f] shadow-md" : "bg-[#2c5ea9] hover:-translate-y-0.5 hover:bg-[#244d8f] hover:shadow-lg"} ${isDrawerOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[12px]"}`}
              style={{ transitionDelay: "0.45s" }}
            >
              Zarezerwuj stolik
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nav-cart-added {
          0%, 100% { transform: scale(1) translateY(0); box-shadow: none; }
          18% { transform: scale(1.08) translateY(-2px); background-color: #d4f0e0; border-color: #9dd4b8; box-shadow: 0 0 0 2px rgba(0, 149, 94, 0.28), 0 6px 18px -5px rgba(0, 149, 94, 0.28); }
          36% { transform: scale(1.04) translateY(-1px); background-color: #dff5e9; border-color: #b5dcc5; box-shadow: 0 0 0 1.5px rgba(0, 149, 94, 0.18), 0 3px 12px -6px rgba(0, 149, 94, 0.15); }
          52% { transform: scale(1.025) translateY(0); background-color: #eaf7f0; border-color: #c8e6d4; box-shadow: 0 0 0 1px rgba(0, 149, 94, 0.1); }
          66% { transform: scale(1.012) translateY(0); background-color: #f3f0c4; border-color: #ede070; }
          78% { transform: scale(1.006) translateY(0); background-color: #f8ef8e; border-color: #f5e860; }
          88% { transform: scale(1.002) translateY(0); background-color: #fce88a; border-color: #ffde00; }
        }
        @keyframes nav-cart-count-bump {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.3); }
          55% { transform: scale(1.05); }
          75% { transform: scale(1.12); }
          88% { transform: scale(0.98); }
        }
      `}</style>
    </>
  );
}
