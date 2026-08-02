export function PairFlowLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-20 w-20">
        <div
          className="absolute h-16 w-16 animate-pulse rounded-full bg-sky-300 opacity-75"
          style={{ backgroundColor: '#7DD3FC' }}
        />
        <div
          className="absolute right-0 h-16 w-16 animate-pulse rounded-full bg-sky-400 opacity-75"
          style={{ animationDelay: '0.5s', backgroundColor: '#38BDF8' }}
        />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-sky-800">PairFlow</p>
        <p className="text-sm text-stone-500">Harmonize Your Cashflow, Together</p>
      </div>
    </div>
  );
}
