/**
 * StatusBadge — Color-coded HTTP status code badge
 */
function getStatusColor(status) {
  if (status >= 200 && status < 300) return 'bg-emerald-500/20 text-emerald-400';
  if (status >= 300 && status < 400) return 'bg-blue-500/20 text-blue-400';
  if (status >= 400 && status < 500) return 'bg-amber-500/20 text-amber-400';
  if (status >= 500) return 'bg-red-500/20 text-red-400';
  return 'bg-gray-500/20 text-gray-400';
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}
