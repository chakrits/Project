import { useState } from 'react';
import { Trash2, Star, StarOff } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import JsonEditor from './JsonEditor';

/**
 * ResponseEditor — Editor for a single response example within an endpoint
 */
export default function ResponseEditor({ response, index, onChange, onRemove, canRemove }) {
  const [expanded, setExpanded] = useState(true);

  const updateField = (field, value) => {
    onChange({ ...response, [field]: value });
  };

  const handleBodyChange = (rawJson) => {
    updateField('bodyRaw', rawJson);
  };

  return (
    <div className="glass-card p-3 animate-fade-in">
      {/* Response header bar */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm hover:text-text-primary transition-colors cursor-pointer"
        >
          <StatusBadge status={response.status || 200} />
          <span className="text-text-secondary font-medium">{response.label || 'Untitled'}</span>
          <svg
            className={`w-3.5 h-3.5 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => updateField('isDefault', !response.isDefault)}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              response.isDefault
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
            }`}
            title={response.isDefault ? 'Default response' : 'Set as default'}
          >
            {response.isDefault ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Remove response"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-3">
            {/* Label */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Label</label>
              <input
                type="text"
                value={response.label || ''}
                onChange={(e) => updateField('label', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-primary border border-border-default 
                  focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                  text-sm text-text-primary placeholder-text-muted transition-colors"
                placeholder="e.g. Success, Not Found"
              />
            </div>
            {/* Status Code */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Status Code</label>
              <input
                type="number"
                value={response.status || 200}
                onChange={(e) => updateField('status', parseInt(e.target.value, 10) || 200)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-primary border border-border-default 
                  focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                  text-sm text-text-primary font-mono transition-colors"
                min={100}
                max={599}
              />
            </div>
            {/* Delay */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Delay (ms)</label>
              <input
                type="number"
                value={response.delay || 0}
                onChange={(e) => updateField('delay', Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-primary border border-border-default 
                  focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                  text-sm text-text-primary font-mono transition-colors"
                min={0}
                max={30000}
                step={100}
                placeholder="0"
              />
            </div>
          </div>

          {/* JSON Body Editor */}
          <JsonEditor
            label="Response Body"
            value={response.bodyRaw || JSON.stringify(response.body || {}, null, 2)}
            onChange={handleBodyChange}
          />

          {/* Template hint */}
          <p className="text-[10px] text-text-muted leading-relaxed">
            <span className="text-text-muted/60">Placeholders: </span>
            <code className="text-amber-400/80">:pathParam</code>
            <span className="text-text-muted/60 mx-1">·</span>
            <code className="text-blue-400/80">{'{{query.field}}'}</code>
            <span className="text-text-muted/60 mx-1">·</span>
            <code className="text-emerald-400/80">{'{{body.field}}'}</code>
          </p>

        </div>
      )}
    </div>
  );
}
