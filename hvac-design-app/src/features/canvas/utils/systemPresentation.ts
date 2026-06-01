const CUSTOM_DOTS = [
  'bg-cyan-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-lime-600',
  'bg-orange-500',
  'bg-sky-500',
];

const KNOWN: Record<string, { dot: string }> = {
  Supply: { dot: 'bg-blue-500' },
  Return: { dot: 'bg-emerald-500' },
  Exhaust: { dot: 'bg-rose-500' },
  'Outside Air': { dot: 'bg-teal-500' },
};

function hashName(name: string): number {
  return Array.from(name).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
}

export function getSystemPresentation(name: string) {
  const known = KNOWN[name];
  if (known) {
    return known;
  }

  return {
    dot: CUSTOM_DOTS[hashName(name) % CUSTOM_DOTS.length],
  };
}
