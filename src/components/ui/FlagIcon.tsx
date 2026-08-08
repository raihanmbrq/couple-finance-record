import { useId } from 'react';

interface FlagIconProps {
  /** Kode negara, mis. 'id', 'gb' */
  code: string;
  className?: string;
}

function IndonesianFlag() {
  return (
    <svg viewBox="0 0 4 3" className="w-full h-full" aria-hidden="true">
      <rect width="4" height="3" fill="#FFFFFF" />
      <rect width="4" height="1.5" fill="#E70011" />
    </svg>
  );
}

function UkFlag({ clipId }: { clipId: string }) {
  return (
    <svg viewBox="0 0 60 30" className="w-full h-full" aria-hidden="true">
      <clipPath id={clipId}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${clipId})`}
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function FlagIcon({ code, className = 'w-5 h-5' }: FlagIconProps) {
  // useId menghasilkan karakter khusus (:) yang tidak aman untuk referensi url(#...),
  // jadi dibersihkan dulu.
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const normalized = code.toLowerCase();

  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10 ${className}`}
    >
      {normalized === 'gb' || normalized === 'uk' || normalized === 'en' ? (
        <UkFlag clipId={clipId} />
      ) : (
        <IndonesianFlag />
      )}
    </span>
  );
}