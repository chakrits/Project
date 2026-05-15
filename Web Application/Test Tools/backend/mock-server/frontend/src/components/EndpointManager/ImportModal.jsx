import { useState, useRef } from 'react';
import { Upload, X, FileJson, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import MethodBadge from '../common/MethodBadge';

/**
 * ImportModal — Drag-drop file upload with preview and import strategy
 */
export default function ImportModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [content, setContent] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [strategy, setStrategy] = useState('merge');
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setContent(null);
    setPreview(null);
    setError(null);
    setSelected(new Set());
    setResult(null);
  };

  const handleFile = async (f) => {
    resetState();
    setFile(f);
    setLoading(true);
    setError(null);

    try {
      const text = await f.text();
      setContent(text);

      // Preview via API
      const res = await fetch('/api/mock-server/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, format: 'auto' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse file');
      }

      setPreview(data);
      // Select all endpoints by default
      setSelected(new Set(data.endpoints.map((_, i) => i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  };

  const toggleEndpoint = (index) => {
    const next = new Set(selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === preview?.endpoints?.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(preview.endpoints.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!content || !preview) return;
    setImporting(true);
    setError(null);

    try {
      // Filter to only selected endpoints
      const selectedEndpoints = preview.endpoints.filter((_, i) => selected.has(i));

      // Build a modified content that only includes selected endpoints
      // We send the full content and let the server parse it, then use strategy
      const res = await fetch('/api/mock-server/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format: 'auto',
          strategy
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      // Notify parent to refresh endpoints
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const formatBadge = preview?.format === 'swagger' 
    ? `Swagger ${preview.version}` 
    : preview?.format === 'openapi'
    ? `OpenAPI ${preview.version}`
    : preview?.format === 'postman'
    ? `Postman ${preview.version}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-surface-secondary border border-border-default rounded-xl shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-text-primary">Import API Specification</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Drop zone */}
          {!preview && !loading && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-accent bg-accent/10'
                  : 'border-border-default hover:border-accent/50 hover:bg-surface-hover/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileInput}
                className="hidden"
              />
              <FileJson size={40} className="mx-auto mb-3 text-text-muted" />
              <p className="text-sm text-text-primary font-medium">
                Drop file here or click to browse
              </p>
              <p className="text-xs text-text-muted mt-1">
                Supports: OpenAPI 3.0, Swagger 2.0, Postman Collection v2.1
              </p>
              <div className="flex justify-center gap-2 mt-3">
                {['.json', '.yaml', '.yml'].map(ext => (
                  <span key={ext} className="px-2 py-0.5 rounded bg-surface-hover text-[10px] text-text-muted font-mono">
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Parsing specification...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-400 font-medium">Parse Error</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Result success */}
          {result && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-emerald-400 font-medium">Import Complete!</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Imported {result.imported} endpoints{result.skipped > 0 ? `, skipped ${result.skipped} duplicates` : ''}.
                  Total: {result.total} endpoints.
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !result && (
            <>
              {/* Detected info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-accent/20 text-accent">
                  {formatBadge}
                </span>
                <div>
                  <p className="text-sm text-text-primary font-medium">{preview.title}</p>
                  <p className="text-[11px] text-text-muted">
                    {preview.endpointCount} endpoint{preview.endpointCount !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button
                  onClick={resetState}
                  className="ml-auto text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  Change file
                </button>
              </div>

              {/* Endpoint list */}
              <div className="border border-border-default rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-surface-tertiary border-b border-border-default">
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.size === preview.endpoints.length}
                      onChange={toggleAll}
                      className="rounded accent-accent"
                    />
                    Select All ({selected.size}/{preview.endpoints.length})
                  </label>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {preview.endpoints.map((ep, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 px-3 py-2 border-b border-border-subtle cursor-pointer transition-colors ${
                        selected.has(idx) ? 'bg-accent/5' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(idx)}
                        onChange={() => toggleEndpoint(idx)}
                        className="rounded accent-accent flex-shrink-0"
                      />
                      <MethodBadge method={ep.method} />
                      <span className="text-xs font-mono text-text-primary truncate flex-1">{ep.path}</span>
                      <span className="text-[10px] text-text-muted flex-shrink-0">
                        {ep.responses?.length || 0} resp.
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Import Strategy</label>
                <div className="flex gap-3">
                  {[
                    { value: 'merge', label: 'Merge', desc: 'Keep existing, add new endpoints' },
                    { value: 'replace', label: 'Replace All', desc: 'Clear existing, import only these' }
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        strategy === opt.value
                          ? 'border-accent bg-accent/5'
                          : 'border-border-default hover:border-border-focus'
                      }`}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={opt.value}
                        checked={strategy === opt.value}
                        onChange={() => setStrategy(opt.value)}
                        className="mt-0.5 accent-accent"
                      />
                      <div>
                        <p className="text-sm text-text-primary font-medium">{opt.label}</p>
                        <p className="text-[11px] text-text-muted">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {preview && !result && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border-default">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              {importing ? 'Importing...' : `Import ${selected.size} Endpoint${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
