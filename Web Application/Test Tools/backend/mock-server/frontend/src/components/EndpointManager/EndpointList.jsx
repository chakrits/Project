import { useState } from 'react';
import { Plus, Search, Upload, Download } from 'lucide-react';
import MethodBadge from '../common/MethodBadge';

/**
 * EndpointList — Sidebar listing all mock endpoints, filterable and clickable
 */
export default function EndpointList({ endpoints, selectedId, onSelect, onAdd, onImport, onExport }) {
  const [filter, setFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const filtered = endpoints.filter(ep => {
    const matchesSearch = !filter || 
      ep.path.toLowerCase().includes(filter.toLowerCase()) ||
      ep.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || ep.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border-default">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Endpoints</h2>
          <div className="flex items-center gap-1">
            {onImport && (
              <button
                onClick={onImport}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                  text-text-secondary hover:text-text-primary hover:bg-surface-hover
                  text-xs font-medium transition-all cursor-pointer"
                title="Import from Swagger/OpenAPI/Postman"
              >
                <Upload size={13} />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                  text-text-secondary hover:text-text-primary hover:bg-surface-hover
                  text-xs font-medium transition-all cursor-pointer"
                title="Export endpoints as JSON"
              >
                <Download size={13} />
              </button>
            )}
            <button
              onClick={onAdd}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg 
                bg-accent/20 text-accent hover:bg-accent/30 
                text-xs font-medium transition-all cursor-pointer"
            >
              <Plus size={14} />
              New
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-primary border border-border-default 
              focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
              text-xs text-text-primary placeholder-text-muted transition-colors"
          />
        </div>

        {/* Method filter */}
        <div className="flex gap-1 flex-wrap">
          {methods.map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                methodFilter === m
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-text-muted hover:text-text-secondary border border-transparent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoint list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-text-muted text-xs">
            {endpoints.length === 0 ? 'No endpoints yet' : 'No matching endpoints'}
          </div>
        )}
        {filtered.map(ep => (
          <button
            key={ep.id}
            onClick={() => onSelect(ep.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-border-subtle transition-all cursor-pointer ${
              selectedId === ep.id
                ? 'bg-accent/10 border-l-2 border-l-accent'
                : 'hover:bg-surface-hover border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <MethodBadge method={ep.method} />
              <span className="text-xs font-mono text-text-primary truncate">{ep.path}</span>
            </div>
            {ep.description && (
              <p className="text-[11px] text-text-muted truncate pl-1">{ep.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1 pl-1">
              <span className="text-[10px] text-text-muted">
                {ep.responses?.length || 0} response{(ep.responses?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
