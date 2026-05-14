import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * JsonEditor — A syntax-highlighted JSON editor textarea
 */
export default function JsonEditor({ value, onChange, label, error }) {
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const raw = e.target.value;
    onChange(raw);

    // Validate JSON
    try {
      if (raw.trim()) {
        JSON.parse(raw);
        setLocalError(null);
      }
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      setLocalError(null);
    } catch {
      // Can't format invalid JSON
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed));
      setLocalError(null);
    } catch {
      // Can't minify invalid JSON
    }
  };

  const displayError = error || localError;
  const isValid = !displayError && value?.trim();

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary">{label}</label>
          <div className="flex items-center gap-2">
            {isValid && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 size={10} /> Valid JSON
              </span>
            )}
            <button
              onClick={formatJson}
              className="text-[10px] text-text-muted hover:text-accent transition-colors cursor-pointer"
            >
              Format
            </button>
            <button
              onClick={minifyJson}
              className="text-[10px] text-text-muted hover:text-accent transition-colors cursor-pointer"
            >
              Minify
            </button>
          </div>
        </div>
      )}
      <textarea
        value={value}
        onChange={handleChange}
        spellCheck={false}
        className={`json-editor w-full min-h-[160px] p-3 rounded-lg 
          bg-surface-primary border transition-colors
          focus:outline-none focus:ring-1
          ${displayError 
            ? 'border-red-500/50 focus:ring-red-500/30' 
            : 'border-border-default focus:ring-accent/30 focus:border-accent/50'
          }
          text-text-primary placeholder-text-muted`}
        placeholder='{ "key": "value" }'
      />
      {displayError && (
        <p className="flex items-center gap-1 text-[11px] text-red-400">
          <AlertCircle size={11} />
          {displayError}
        </p>
      )}
    </div>
  );
}
