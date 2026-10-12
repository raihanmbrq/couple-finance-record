export function PairFlowLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-1">
        <img
          src="/icons/icon-512.png"
          alt="PairFlow Logo"
          className="w-14 h-14 rounded-2xl object-contain drop-shadow-md animate-pulse"
        />
      </div>
      <p className="text-sm font-semibold tracking-wide text-text-primary">PairFlow</p>
    </div>
  );
}
