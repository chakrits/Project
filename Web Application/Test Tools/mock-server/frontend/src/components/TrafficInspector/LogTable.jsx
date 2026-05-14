import { useState } from 'react';
import { RefreshCw, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import MethodBadge from '../common/MethodBadge';
import StatusBadge from '../common/StatusBadge';

/**
 * LogTable — Displays recent mock API transaction logs in a sortable table
 */
export default function LogTable({ logs, selectedTraceId, onSelect, onRefresh, onClear, autoRefresh, onToggleAutoRefresh }) {
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sorted = [...logs].sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case 'timestamp': aVal = a.timestamp; bVal = b.timestamp; break;
      case 'method': aVal = a.request?.method; bVal = b.request?.method; break;
      case 'path': aVal = a.request?.path; bVal = b.request?.path; break;
      case 'sourceIp': aVal = a.request?.sourceIp; bVal = b.request?.sourceIp; break;
      case 'status': aVal = a.response?.status; bVal = b.response?.status; break;
      case 'latency': aVal = a.response?.latencyMs; bVal = b.response?.latencyMs; break;
      default: aVal = a.timestamp; bVal = b.timestamp;
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '—';
    }
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-[10px]">
      {sortField === field ? (sortAsc ? '▲' : '▼') : ''}
    </span>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border-default">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Traffic Logs
            <span className="text-text-muted font-normal ml-1.5 text-xs">({logs.length})</span>
          </h2>
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              autoRefresh
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            title={autoRefresh ? 'Auto-refresh ON (2s)' : 'Auto-refresh OFF'}
          >
            {autoRefresh ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            Auto
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
              text-text-secondary hover:text-text-primary hover:bg-surface-hover
              text-xs font-medium transition-all cursor-pointer"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
              text-red-400 hover:bg-red-500/10
              text-xs font-medium transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-sm font-medium">No traffic yet</p>
            <p className="text-xs mt-1">Send a request to <code className="text-accent">/mock-api/...</code> to see logs</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-secondary z-10">
              <tr className="text-text-muted text-left">
                {[
                  { key: 'timestamp', label: 'Time' },
                  { key: 'method', label: 'Method' },
                  { key: 'path', label: 'Path' },
                  { key: 'sourceIp', label: 'Source IP' },
                  { key: 'status', label: 'Status' },
                  { key: 'latency', label: 'Latency' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2 font-medium cursor-pointer hover:text-text-secondary transition-colors select-none"
                  >
                    {col.label}<SortIcon field={col.key} />
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Trace ID</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(log => (
                <tr
                  key={log.traceId}
                  onClick={() => onSelect(log.traceId)}
                  className={`border-b border-border-subtle cursor-pointer transition-all ${
                    selectedTraceId === log.traceId
                      ? 'bg-accent/10'
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  <td className="px-3 py-2.5 text-text-secondary font-mono">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="px-3 py-2.5">
                    <MethodBadge method={log.request?.method} />
                  </td>
                  <td className="px-3 py-2.5 text-text-primary font-mono max-w-[300px] truncate">
                    {log.request?.path}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary font-mono">
                    {log.request?.sourceIp || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={log.response?.status} />
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary font-mono">
                    {log.response?.latencyMs}ms
                  </td>
                  <td className="px-3 py-2.5 text-text-muted font-mono text-[10px]">
                    {log.traceId?.slice(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
