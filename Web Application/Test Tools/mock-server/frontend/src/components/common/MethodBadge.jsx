/**
 * MethodBadge — Color-coded HTTP method badge
 */
const METHOD_COLORS = {
  GET:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PATCH:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function MethodBadge({ method, size = 'sm' }) {
  const colors = METHOD_COLORS[method?.toUpperCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  const sizeClass = size === 'lg' 
    ? 'px-3 py-1 text-sm font-bold' 
    : 'px-2 py-0.5 text-xs font-semibold';

  return (
    <span className={`inline-block rounded border ${colors} ${sizeClass} tracking-wider font-mono`}>
      {method?.toUpperCase()}
    </span>
  );
}
