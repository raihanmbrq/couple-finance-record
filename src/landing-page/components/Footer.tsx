import { Heart, Twitter, Instagram, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Produk',
    links: [
      { label: 'Fitur', href: '/produk/fitur' },
      { label: 'Cara Kerja', href: '/produk/cara-kerja' },
      { label: 'Keamanan', href: '/produk/keamanan' },
      { label: 'Edukasi PWA', href: '/produk/edukasi-pwa' },
      { label: 'Roadmap', href: '/produk/roadmap' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang Kami', href: '/perusahaan/tentang-kami' },
      { label: 'Kontak', href: '/perusahaan/kontak' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Privacy Policy', href: '/bantuan/privacy-policy' },
      { label: 'Terms of Service', href: '/bantuan/terms-of-service' },
      { label: 'Contact Support', href: '/bantuan/contact-support' },
      { label: 'Status', href: '/bantuan/status' },
    ],
  },
];

const socials = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Mail, label: 'Email', href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Top section */}
        <div className="grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:py-16">
          {/* Brand */}
          <div className="max-w-sm">
            <a href="#" className="flex items-center gap-2.5">
              <img
                src="/icons/icon-192.png"
                alt=""
                className="h-9 w-9 rounded-xl object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Pair<span className="text-brand-600">Flow</span>
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Harmonize Your Cashflow, Together. Platform keuangan pasangan #1 di
              Indonesia — transparan, real-time, dan tanpa drama.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 active:scale-95"
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-slate-500 transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 py-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            &copy; 2026 PairFlow Inc. Semua hak dilindungi.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" strokeWidth={0} />
            <span>untuk pasangan Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
