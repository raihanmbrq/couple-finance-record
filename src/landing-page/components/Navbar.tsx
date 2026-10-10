import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Keamanan', href: '#keamanan' },
  { label: 'Edukasi PWA', href: '#pwa' },
];

interface NavbarProps {
  onLogin?: () => void;
  onSignUp?: () => void;
}

export default function Navbar({ onLogin, onSignUp }: NavbarProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isNavSolid = scrolled || mobileOpen;

  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
    } else {
      navigate('/login');
    }
  };

  const handleGetStartedClick = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      navigate('/onboarding');
    }
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.getElementById(href.replace('#', ''));
    if (!target) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    // Keep the URL hash in sync without triggering the browser's instant jump.
    window.history.replaceState(null, '', href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavSolid
          ? 'glass border-b border-slate-200/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex h-16 items-center justify-between lg:h-[72px]">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group text-left"
          >
            <img
              src="/icons/icon-192.png"
              alt="PairFlow Logo"
              className="h-9 w-9 rounded-xl object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Pair<span className="text-brand-600">Flow</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavClick(event, link.href)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={handleLoginClick}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={handleGetStartedClick}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow-emerald transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.97]"
            >
              <span className="relative z-10">Punya Undangan?</span>
              <div className="absolute inset-0 animate-shimmer" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="animate-fade-in border-t border-slate-200/60 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    handleNavClick(event, link.href);
                    setMobileOpen(false);
                  }}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLoginClick();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleGetStartedClick();
                  }}
                  className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-glow-emerald hover:brightness-105 transition-all"
                >
                  Punya Undangan?
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
