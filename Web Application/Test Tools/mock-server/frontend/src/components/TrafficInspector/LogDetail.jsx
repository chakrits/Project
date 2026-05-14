import { X, Copy, Clock, Hash } from 'lucide-react';
import MethodBadge from '../common/MethodBadge';
import StatusBadge from '../common/StatusBadge';
import { buildCurl } from '../../utils/curlBuilder';

/**
 * LogDetail — Side-by-side Request vs Response detail view for a single log entry
 */
export default function LogDetail({ log, onClose }) {
  if (!log) return null;

  const { request, response, matchedEndpoint, traceId, timestamp } = log;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      // Simple feedback — could use a toast system
      const el = document.getElementById('copy-feedback');
      if (el) {
        el.textContent = `${label} copied!`;
        el.classList.remove('opacity-0');
        setTimeout(() => el.classList.add('opacity-0'), 2000);
      }
    });
  };

  const curlCommand = buildCurl(request);

  const JsonBlock = ({ data, maxHeight = '300px' }) => (
    <pre className="json-editor p-3 rounded-lg bg-surface-primary border border-border-subtle overflow-auto text-text-primary"
      style={{ maxHeight }}>
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );

  const HeadersTable = ({ headers }) => (
    <div className="overflow-auto max-h-[200px]">
      <table className="w-full text-[11px]">
        <tbody>
          {Object.entries(headers || {}).map(([key, value]) => (
            <tr key={key} className="border-b border-border-subtle">
              <td className="px-2 py-1 text-text-muted font-mono whitespace-nowrap align-top">{key}</td>
              <td className="px-2 py-1 text-text-primary font-mono break-all">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-slide-in">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 border-b border-border-default">
        <div className="flex items-center gap-3">
          <MethodBadge method={request?.method} size="lg" />
          <div>
            <p className="text-sm font-mono text-text-primary">{request?.path}</p>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {new Date(timestamp).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Hash size={10} />
                {traceId?.slice(0, 12)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span id="copy-feedback" className="text-[10px] text-emerald-400 opacity-0 transition-opacity" />
          <button
            onClick={() => copyToClipboard(curlCommand, 'cURL')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
              bg-surface-hover text-text-secondary hover:text-text-primary
              text-xs font-medium transition-all cursor-pointer"
          >
            <Copy size={12} />
            Copy as cURL
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Matched endpoint info */}
      {matchedEndpoint && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20 text-[11px]">
          <span className="text-text-muted">Matched: </span>
          <span className="text-accent font-mono font-medium">
            {matchedEndpoint.method} {matchedEndpoint.path}
          </span>
          <span className="text-text-muted ml-2">→ </span>
          <span className="text-text-secondary">{response?.label}</span>
        </div>
      )}

      {/* Side-by-side panels */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-2 gap-3 h-full">
          {/* Request Panel */}
          <div className="glass-card p-3 flex flex-col overflow-hidden">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Request
            </h3>

            <div className="space-y-3 overflow-y-auto flex-1">
              {/* URL */}
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">URL</label>
                <p className="text-xs font-mono text-text-primary mt-0.5 break-all">{request?.url}</p>
              </div>

              {/* Source IP */}
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Source IP</label>
                <p className="text-xs font-mono text-text-primary mt-0.5">{request?.sourceIp || '—'}</p>
              </div>

              {/* Query Params */}
              {request?.query && Object.keys(request.query).length > 0 && (
                <div>
                  <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Query Params</label>
                  <JsonBlock data={request.query} maxHeight="120px" />
                </div>
              )}

              {/* Headers */}
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Headers</label>
                <div className="mt-1">
                  <HeadersTable headers={request?.headers} />
                </div>
              </div>

              {/* Body */}
              {request?.body && (
                <div>
                  <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Body</label>
                  <div className="mt-1">
                    <JsonBlock data={request.body} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response Panel */}
          <div className="glass-card p-3 flex flex-col overflow-hidden">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Response
              <StatusBadge status={response?.status} />
              <span className="text-text-muted font-normal text-[10px] ml-auto">
                {response?.latencyMs}ms
              </span>
            </h3>

            <div className="space-y-3 overflow-y-auto flex-1">
              {/* Status */}
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Status Code</label>
                <p className="text-xs font-mono text-text-primary mt-0.5">{response?.status}</p>
              </div>

              {/* Response Body */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Body</label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(response?.body, null, 2), 'Response body')}
                    className="text-[10px] text-text-muted hover:text-accent transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="mt-1">
                  <JsonBlock data={response?.body} maxHeight="400px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
