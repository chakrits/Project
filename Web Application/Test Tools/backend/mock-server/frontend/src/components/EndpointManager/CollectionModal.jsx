import { useState, useEffect } from 'react';
import { X, FolderOpen } from 'lucide-react';

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#a855f7', // purple
];

export default function CollectionModal({ isOpen, mode, collection, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(collection?.name || '');
      setDescription(collection?.description || '');
      setColor(collection?.color || PRESET_COLORS[0]);
      setError(null);
      setSaving(false);
    }
  }, [isOpen, collection]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onConfirm({ name: name.trim(), description: description.trim(), color });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-secondary border border-border-default rounded-xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-text-primary">
              {mode === 'create' ? 'New Collection' : 'Rename Collection'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              autoFocus
              placeholder="e.g. User Service"
              className="w-full px-3 py-2 rounded-lg bg-surface-primary border border-border-default
                focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                text-sm text-text-primary placeholder-text-muted transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 rounded-lg bg-surface-primary border border-border-default
                focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                text-sm text-text-primary placeholder-text-muted transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-2 block">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all cursor-pointer ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface-secondary ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
