import { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import MethodBadge from '../common/MethodBadge';
import StatusBadge from '../common/StatusBadge';
import ResponseEditor from './ResponseEditor';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const OPERATORS = ['eq', 'neq', 'contains', 'exists', 'regex'];

// ─── RuleCard ────────────────────────────────────────────────────────────────

function ConditionRow({ condition, onChange, onRemove }) {
  const update = (field, value) => onChange({ ...condition, [field]: value });

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <select
        value={condition.source}
        onChange={(e) => update('source', e.target.value)}
        className="px-2 py-1 rounded-md bg-surface-secondary border border-border-default
          text-[11px] text-accent font-mono cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        <option value="body">body</option>
        <option value="query">query</option>
        <option value="header">header</option>
        <option value="params">params</option>
      </select>
      <span className="text-[10px] text-text-muted">.</span>
      <input
        type="text"
        value={condition.field}
        onChange={(e) => update('field', e.target.value)}
        placeholder="field.path"
        className="w-28 px-2 py-1 rounded-md bg-surface-secondary border border-border-default
          text-[11px] text-text-primary font-mono placeholder-text-muted
          focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
      <select
        value={condition.operator}
        onChange={(e) => update('operator', e.target.value)}
        className="px-2 py-1 rounded-md bg-surface-secondary border border-border-default
          text-[11px] text-text-muted font-mono cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
      </select>
      {condition.operator !== 'exists' && (
        <input
          type="text"
          value={condition.value || ''}
          onChange={(e) => update('value', e.target.value)}
          placeholder="value"
          className="flex-1 min-w-[80px] px-2 py-1 rounded-md bg-surface-secondary border border-border-default
            text-[11px] text-emerald-400 font-mono placeholder-text-muted
            focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      )}
      <button
        onClick={onRemove}
        className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}

function RuleCard({ rule, index, responses, onChange, onRemove }) {
  const updateCondition = (ci, updated) => {
    const conditions = [...rule.conditions];
    conditions[ci] = updated;
    onChange({ ...rule, conditions });
  };

  const addCondition = () => {
    onChange({
      ...rule,
      conditions: [...rule.conditions, { source: 'body', field: '', operator: 'eq', value: '' }]
    });
  };

  const removeCondition = (ci) => {
    onChange({ ...rule, conditions: rule.conditions.filter((_, i) => i !== ci) });
  };

  const selectedResponse = responses.find(r => r.label === rule.responseLabel);

  return (
    <div className="rounded-lg border border-border-default bg-surface-primary overflow-hidden">
      {/* Rule header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-secondary border-b border-border-subtle">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          Rule {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          title="Remove rule"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* IF block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">IF</span>
            <button
              onClick={addCondition}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]
                text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-all cursor-pointer"
            >
              <Plus size={9} /> condition
            </button>
          </div>
          {rule.conditions.length === 0 ? (
            <p className="text-[11px] text-text-muted italic pl-2">
              No conditions — add at least one to use this rule
            </p>
          ) : (
            <div className="pl-2 space-y-1.5 border-l-2 border-blue-500/20">
              {rule.conditions.map((cond, ci) => (
                <ConditionRow
                  key={ci}
                  condition={cond}
                  onChange={(updated) => updateCondition(ci, updated)}
                  onRemove={() => removeCondition(ci)}
                />
              ))}
            </div>
          )}
        </div>

        {/* THEN block */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex-shrink-0">
            → RETURN
          </span>
          <select
            value={rule.responseLabel}
            onChange={(e) => onChange({ ...rule, responseLabel: e.target.value })}
            className="flex-1 px-2 py-1 rounded-md bg-surface-secondary border border-border-default
              text-xs text-text-primary font-mono cursor-pointer
              focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="">— select response —</option>
            {responses.map(r => (
              <option key={r.label} value={r.label}>
                [{r.status}] {r.label}
              </option>
            ))}
          </select>
          {selectedResponse && (
            <StatusBadge status={selectedResponse.status} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fromBackendFormat(backendResponses) {
  const responses = (backendResponses || []).map(r => ({
    label: r.label || '',
    status: r.status || 200,
    delay: r.delay || 0,
    body: r.body || {},
    bodyRaw: JSON.stringify(r.body || {}, null, 2),
    isDefault: r.isDefault || false,
  }));

  const rules = (backendResponses || [])
    .filter(r => r.conditions && r.conditions.length > 0)
    .map(r => ({ conditions: r.conditions, responseLabel: r.label }));

  const defaultResp = (backendResponses || []).find(r => r.isDefault);
  const defaultLabel = defaultResp?.label || responses[0]?.label || '';

  return { responses, rules, defaultLabel };
}

function toBackendFormat(responses, rules, defaultLabel) {
  return responses.map(r => {
    const rule = rules.find(ru => ru.responseLabel === r.label);
    return {
      label: r.label,
      status: r.status,
      delay: r.delay || 0,
      body: r.body,
      isDefault: r.label === defaultLabel,
      conditions: rule?.conditions || [],
    };
  });
}

// ─── EndpointEditor ───────────────────────────────────────────────────────────

export default function EndpointEditor({ endpoint, onSave, onDelete, isNew }) {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [responses, setResponses] = useState([
    { label: 'Success', status: 200, delay: 0, body: {}, bodyRaw: '{}', isDefault: true }
  ]);
  const [rules, setRules] = useState([]);
  const [defaultLabel, setDefaultLabel] = useState('Success');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [responsesExpanded, setResponsesExpanded] = useState(true);

  useEffect(() => {
    if (endpoint) {
      setMethod(endpoint.method || 'GET');
      setPath(endpoint.path || '');
      setDescription(endpoint.description || '');
      const { responses: r, rules: ru, defaultLabel: dl } = fromBackendFormat(endpoint.responses);
      setResponses(r);
      setRules(ru);
      setDefaultLabel(dl);
    }
  }, [endpoint?.id]);

  const addRule = () => {
    setRules([...rules, {
      conditions: [{ source: 'body', field: '', operator: 'eq', value: '' }],
      responseLabel: responses[0]?.label || ''
    }]);
  };

  const updateRule = (i, updated) => {
    const next = [...rules];
    next[i] = updated;
    setRules(next);
  };

  const removeRule = (i) => setRules(rules.filter((_, idx) => idx !== i));

  const addResponse = () => {
    const newResp = { label: '', status: 200, delay: 0, body: {}, bodyRaw: '{}', isDefault: false };
    setResponses([...responses, newResp]);
  };

  const updateResponse = (i, updated) => {
    const next = [...responses];
    next[i] = updated;
    setResponses(next);
  };

  const removeResponse = (i) => {
    const next = responses.filter((_, idx) => idx !== i);
    if (defaultLabel === responses[i].label && next.length > 0) {
      setDefaultLabel(next[0].label);
    }
    setRules(rules.filter(r => r.responseLabel !== responses[i].label));
    setResponses(next);
  };

  const handleSave = async () => {
    if (!path) { setMessage({ type: 'error', text: 'Path is required' }); return; }
    if (responses.length === 0) { setMessage({ type: 'error', text: 'At least one response is required' }); return; }

    const parsedResponses = [];
    for (let i = 0; i < responses.length; i++) {
      const r = responses[i];
      try {
        parsedResponses.push({ ...r, body: r.bodyRaw ? JSON.parse(r.bodyRaw) : {} });
      } catch {
        setMessage({ type: 'error', text: `Response "${r.label || `#${i + 1}`}" has invalid JSON` });
        return;
      }
    }

    const backendResponses = toBackendFormat(parsedResponses, rules, defaultLabel);

    setSaving(true);
    try {
      await onSave({ method, path, description, responses: backendResponses });
      setMessage({ type: 'success', text: isNew ? 'Endpoint created!' : 'Endpoint saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const mockUrl = `http://localhost:3000/mock-api${path}`;
  const defaultResponse = responses.find(r => r.label === defaultLabel);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <MethodBadge method={method} size="lg" />
          <span className="text-sm font-mono text-text-secondary">{path || '/...'}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={onDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg
              text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all cursor-pointer">
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg
              bg-accent hover:bg-accent-hover text-white
              text-xs font-medium transition-all cursor-pointer disabled:opacity-50">
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-3 mt-3 px-3 py-2 rounded-lg text-xs font-medium animate-fade-in ${
          message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Method + Path ── */}
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-primary border border-border-default
                focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                text-sm text-text-primary font-mono cursor-pointer transition-colors">
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Path</label>
            <input type="text" value={path} onChange={(e) => setPath(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-primary border border-border-default
                focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                text-sm text-text-primary font-mono placeholder-text-muted transition-colors"
              placeholder="/api/resource/:id" />
          </div>
        </div>

        {/* ── Description ── */}
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-primary border border-border-default
              focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
              text-sm text-text-primary placeholder-text-muted transition-colors"
            placeholder="Brief description of this endpoint" />
        </div>

        {/* ── Mock URL ── */}
        {path && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-primary border border-border-subtle">
            <ExternalLink size={12} className="text-text-muted flex-shrink-0" />
            <code className="text-xs text-text-secondary truncate">{mockUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(mockUrl)}
              className="ml-auto p-1 rounded text-text-muted hover:text-accent transition-colors cursor-pointer flex-shrink-0"
              title="Copy URL">
              <Copy size={12} />
            </button>
          </div>
        )}

        {/* ── ROUTING RULES ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Routing Rules</h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                First matching rule wins — evaluated before default
              </p>
            </div>
            <button onClick={addRule}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                bg-blue-500/10 text-blue-400 hover:bg-blue-500/20
                text-xs font-medium transition-all cursor-pointer">
              <Plus size={13} /> Add Rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-default p-4 text-center">
              <p className="text-xs text-text-muted">No routing rules — all requests return the default response</p>
              <button onClick={addRule}
                className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                + Add your first rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <RuleCard
                  key={i}
                  rule={rule}
                  index={i}
                  responses={responses}
                  onChange={(updated) => updateRule(i, updated)}
                  onRemove={() => removeRule(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── DEFAULT ── */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-amber-400">Default Response</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Returned when no rule matches</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={defaultLabel}
                onChange={(e) => setDefaultLabel(e.target.value)}
                className="px-2 py-1 rounded-md bg-surface-primary border border-border-default
                  text-xs text-text-primary font-mono cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {responses.map(r => (
                  <option key={r.label} value={r.label}>[{r.status}] {r.label}</option>
                ))}
              </select>
              {defaultResponse && <StatusBadge status={defaultResponse.status} />}
            </div>
          </div>
        </div>

        {/* ── RESPONSES ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setResponsesExpanded(!responsesExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-accent transition-colors cursor-pointer"
            >
              {responsesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Response Bodies
              <span className="text-text-muted font-normal text-xs">({responses.length})</span>
            </button>
            <button onClick={addResponse}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                bg-surface-hover text-text-secondary hover:text-text-primary
                text-xs font-medium transition-all cursor-pointer">
              <Plus size={13} /> Add Response
            </button>
          </div>

          {responsesExpanded && (
            <div className="space-y-3 animate-fade-in">
              {responses.map((resp, idx) => (
                <ResponseEditor
                  key={idx}
                  response={resp}
                  index={idx}
                  onChange={(updated) => updateResponse(idx, updated)}
                  onRemove={() => removeResponse(idx)}
                  canRemove={responses.length > 1}
                  isDefault={resp.label === defaultLabel}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
