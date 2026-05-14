const { selectResponse, evaluateConditions, evaluateCondition, interpolateTemplate, interpolateParams } = require('../../mock-server/engine/responseSelector');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEndpoint(responses) {
  return { id: 'test', method: 'POST', path: '/test', responses };
}

function sel(endpoint, body = {}, query = {}) {
  return selectResponse(endpoint, query, {}, {}, body);
}

// ─── Unit: evaluateCondition ─────────────────────────────────────────────────

describe('evaluateCondition', () => {
  test('eq — matches string value', () => {
    expect(evaluateCondition({ source: 'body', field: 'method', operator: 'eq', value: 'SummaryResult' }, {}, { method: 'SummaryResult' })).toBe(true);
  });

  test('eq — no match', () => {
    expect(evaluateCondition({ source: 'body', field: 'method', operator: 'eq', value: 'X' }, {}, { method: 'Y' })).toBe(false);
  });

  test('eq — coerces number to string', () => {
    expect(evaluateCondition({ source: 'body', field: 'count', operator: 'eq', value: '5' }, {}, { count: 5 })).toBe(true);
  });

  test('neq — matches when different', () => {
    expect(evaluateCondition({ source: 'body', field: 'role', operator: 'neq', value: 'admin' }, {}, { role: 'guest' })).toBe(true);
  });

  test('contains — substring match', () => {
    expect(evaluateCondition({ source: 'body', field: 'name', operator: 'contains', value: 'John' }, {}, { name: 'John Doe' })).toBe(true);
  });

  test('exists — field present', () => {
    expect(evaluateCondition({ source: 'body', field: 'token', operator: 'exists' }, {}, { token: 'abc' })).toBe(true);
  });

  test('exists — field absent', () => {
    expect(evaluateCondition({ source: 'body', field: 'token', operator: 'exists' }, {}, {})).toBe(false);
  });

  test('regex — pattern match', () => {
    expect(evaluateCondition({ source: 'body', field: 'code', operator: 'regex', value: '^I01-' }, {}, { code: 'I01-26-0000395' })).toBe(true);
  });

  test('regex — invalid regex returns false (no throw)', () => {
    expect(evaluateCondition({ source: 'body', field: 'x', operator: 'regex', value: '(unclosed' }, {}, { x: 'test' })).toBe(false);
  });

  test('dot notation — nested field', () => {
    expect(evaluateCondition({ source: 'body', field: 'conditions.0.en', operator: 'eq', value: 'I01-26-0000395' }, {}, {
      conditions: [{ en: 'I01-26-0000395' }]
    })).toBe(true);
  });

  test('source: query — reads from query params', () => {
    expect(evaluateCondition({ source: 'query', field: 'type', operator: 'eq', value: 'summary' }, { type: 'summary' }, {})).toBe(true);
  });

  test('missing field — eq returns false (not error)', () => {
    expect(evaluateCondition({ source: 'body', field: 'missing', operator: 'eq', value: 'x' }, {}, {})).toBe(false);
  });
});

// ─── Unit: evaluateConditions (AND logic) ────────────────────────────────────

describe('evaluateConditions — AND logic', () => {
  const conditions = [
    { source: 'body', field: 'method', operator: 'eq', value: 'SummaryResult' },
    { source: 'body', field: 'bu', operator: 'eq', value: '001' }
  ];

  test('all match → true', () => {
    expect(evaluateConditions(conditions, {}, { method: 'SummaryResult', bu: '001' })).toBe(true);
  });

  test('partial match → false', () => {
    expect(evaluateConditions(conditions, {}, { method: 'SummaryResult', bu: '999' })).toBe(false);
  });

  test('empty conditions array → false', () => {
    expect(evaluateConditions([], {}, { method: 'x' })).toBe(false);
  });
});

// ─── Integration: selectResponse Priority 0 ──────────────────────────────────

describe('selectResponse — Priority 0 conditions', () => {
  const endpoint = makeEndpoint([
    {
      label: 'Summary',
      status: 200,
      body: { type: 'summary' },
      conditions: [{ source: 'body', field: 'method', operator: 'eq', value: 'SummaryResult' }]
    },
    {
      label: 'Detail',
      status: 200,
      body: { type: 'detail' },
      conditions: [{ source: 'body', field: 'method', operator: 'eq', value: 'DetailResult' }]
    },
    {
      label: 'Default',
      status: 400,
      body: { error: 'bad request' },
      isDefault: true
    }
  ]);

  test('body.method=SummaryResult → Summary response', () => {
    expect(sel(endpoint, { method: 'SummaryResult' }).label).toBe('Summary');
  });

  test('body.method=DetailResult → Detail response', () => {
    expect(sel(endpoint, { method: 'DetailResult' }).label).toBe('Detail');
  });

  test('no match → fallback to isDefault', () => {
    const result = sel(endpoint, { method: 'Unknown' });
    expect(result.label).toBe('Default');
    expect(result.status).toBe(400);
  });

  test('empty body → fallback to isDefault', () => {
    expect(sel(endpoint, {}).label).toBe('Default');
  });

  // Case 5: first match wins (top-down)
  test('multi-match — first response wins', () => {
    const ep = makeEndpoint([
      { label: 'A', status: 200, body: {}, conditions: [{ source: 'body', field: 'role', operator: 'exists' }] },
      { label: 'B', status: 201, body: {}, conditions: [{ source: 'body', field: 'role', operator: 'eq', value: 'admin' }] }
    ]);
    // Both A and B match { role: 'admin' } — A wins (first)
    expect(sel(ep, { role: 'admin' }).label).toBe('A');
  });

  // GET + JSON body
  test('conditions work regardless of HTTP method (GET+body)', () => {
    const ep = makeEndpoint([
      { label: 'Report', status: 200, body: { data: [] }, conditions: [{ source: 'body', field: 'type', operator: 'eq', value: 'report' }] },
      { label: 'Default', status: 200, body: {}, isDefault: true }
    ]);
    expect(sel(ep, { type: 'report' }).label).toBe('Report');
  });

  // Backward compat — no conditions → skip Priority 0
  test('response without conditions is skipped in Priority 0', () => {
    const ep = makeEndpoint([
      { label: 'Only', status: 200, body: {}, isDefault: true }
    ]);
    expect(sel(ep, { method: 'Anything' }).label).toBe('Only');
  });

  // Priority 0 overrides ?__code
  test('conditions (Priority 0) take precedence over ?__code (Priority 1)', () => {
    const result = selectResponse(endpoint, { __code: '400' }, {}, {}, { method: 'SummaryResult' });
    expect(result.label).toBe('Summary');
  });
});

// ─── Unit: evaluateCondition — header source ──────────────────────────────────

describe('evaluateCondition — header source', () => {
  test('eq — matches Authorization header', () => {
    expect(evaluateCondition(
      { source: 'header', field: 'authorization', operator: 'eq', value: 'Bearer token123' },
      {}, {}, { authorization: 'Bearer token123' }
    )).toBe(true);
  });

  test('contains — partial match on Content-Type', () => {
    expect(evaluateCondition(
      { source: 'header', field: 'content-type', operator: 'contains', value: 'application/json' },
      {}, {}, { 'content-type': 'application/json; charset=utf-8' }
    )).toBe(true);
  });

  test('exists — header present', () => {
    expect(evaluateCondition(
      { source: 'header', field: 'x-api-key', operator: 'exists' },
      {}, {}, { 'x-api-key': 'secret' }
    )).toBe(true);
  });

  test('exists — header absent → false', () => {
    expect(evaluateCondition(
      { source: 'header', field: 'authorization', operator: 'exists' },
      {}, {}, {}
    )).toBe(false);
  });

  test('neq — different header value', () => {
    expect(evaluateCondition(
      { source: 'header', field: 'x-role', operator: 'neq', value: 'admin' },
      {}, {}, { 'x-role': 'guest' }
    )).toBe(true);
  });
});

// ─── Integration: selectResponse — header conditions ─────────────────────────

describe('selectResponse — header conditions', () => {
  const secureEndpoint = makeEndpoint([
    {
      label: 'Authorized',
      status: 200,
      body: { data: 'secret' },
      conditions: [{ source: 'header', field: 'authorization', operator: 'exists' }]
    },
    {
      label: 'Unauthorized',
      status: 401,
      body: { error: 'Unauthorized' },
      isDefault: true
    }
  ]);

  test('request with Authorization header → 200 Authorized', () => {
    const result = selectResponse(secureEndpoint, {}, { authorization: 'Bearer abc' }, {}, {});
    expect(result.label).toBe('Authorized');
    expect(result.status).toBe(200);
  });

  test('request without Authorization header → 401 Unauthorized (default)', () => {
    const result = selectResponse(secureEndpoint, {}, {}, {}, {});
    expect(result.label).toBe('Unauthorized');
    expect(result.status).toBe(401);
  });
});

// ─── Unit: interpolateTemplate ────────────────────────────────────────────────

describe('interpolateTemplate', () => {
  test('replaces {{query.name}} with query param value', () => {
    const body = { message: 'Hello {{query.name}}' };
    expect(interpolateTemplate(body, { name: 'john' }, {}))
      .toEqual({ message: 'Hello john' });
  });

  test('replaces {{body.field}} with request body value', () => {
    const body = { greeting: 'Hi {{body.username}}' };
    expect(interpolateTemplate(body, {}, { username: 'peter' }))
      .toEqual({ greeting: 'Hi peter' });
  });

  test('supports dot-notation for nested body field', () => {
    const body = { role: '{{body.user.role}}' };
    expect(interpolateTemplate(body, {}, { user: { role: 'admin' } }))
      .toEqual({ role: 'admin' });
  });

  test('returns empty string for missing query field', () => {
    const body = { x: '{{query.missing}}' };
    expect(interpolateTemplate(body, {}, {})).toEqual({ x: '' });
  });

  test('returns empty string for missing body field', () => {
    const body = { x: '{{body.missing}}' };
    expect(interpolateTemplate(body, {}, {})).toEqual({ x: '' });
  });

  test('works on nested objects recursively', () => {
    const body = { outer: { inner: '{{query.val}}' } };
    expect(interpolateTemplate(body, { val: '42' }, {}))
      .toEqual({ outer: { inner: '42' } });
  });

  test('works on arrays recursively', () => {
    const body = ['{{query.a}}', '{{query.b}}'];
    expect(interpolateTemplate(body, { a: 'x', b: 'y' }, {}))
      .toEqual(['x', 'y']);
  });

  test('leaves non-template strings unchanged', () => {
    const body = { message: 'static text' };
    expect(interpolateTemplate(body, { name: 'ignored' }, {}))
      .toEqual({ message: 'static text' });
  });

  test('coerces numeric query param to string', () => {
    const body = { count: '{{query.n}}' };
    expect(interpolateTemplate(body, { n: 5 }, {}))
      .toEqual({ count: '5' });
  });
});

// ─── Integration: selectResponse — template + path params combined ────────────

describe('selectResponse — template interpolation', () => {
  test('{{query.name}} is replaced in response body', () => {
    const ep = makeEndpoint([
      { label: 'ok', status: 200, isDefault: true, body: { message: 'Hello {{query.name}}' } }
    ]);
    const result = selectResponse(ep, { name: 'peter' }, {}, {}, {});
    expect(result.body.message).toBe('Hello peter');
  });

  test('{{body.role}} is replaced from request body', () => {
    const ep = makeEndpoint([
      { label: 'ok', status: 200, isDefault: true, body: { you_are: '{{body.role}}' } }
    ]);
    const result = selectResponse(ep, {}, {}, {}, { role: 'admin' });
    expect(result.body.you_are).toBe('admin');
  });

  test(':pathParam and {{query.x}} work together', () => {
    const ep = {
      id: 'combo', method: 'GET', path: '/api/users/:id',
      responses: [{
        label: 'ok', status: 200, isDefault: true,
        body: { id: ':id', greeting: 'Hello {{query.name}}' }
      }]
    };
    const result = selectResponse(ep, { name: 'john' }, {}, { id: '42' }, {});
    expect(result.body.id).toBe('42');
    expect(result.body.greeting).toBe('Hello john');
  });

  test('condition match + template interpolation together', () => {
    const ep = makeEndpoint([
      {
        label: 'NamedGreeting',
        status: 200,
        body: { message: 'Hello {{query.name}}!' },
        conditions: [{ source: 'query', field: 'name', operator: 'exists' }]
      },
      { label: 'Default', status: 200, body: { message: 'Hello stranger' }, isDefault: true }
    ]);
    const withName = selectResponse(ep, { name: 'chakrit' }, {}, {}, {});
    expect(withName.body.message).toBe('Hello chakrit!');

    const withoutName = selectResponse(ep, {}, {}, {}, {});
    expect(withoutName.body.message).toBe('Hello stranger');
  });
});

// ─── Unit: evaluateCondition — params source ──────────────────────────────────

describe('evaluateCondition — params source', () => {
  test('eq — matches path param value', () => {
    expect(evaluateCondition(
      { source: 'params', field: 'id', operator: 'eq', value: '1' },
      {}, {}, {}, { id: '1' }
    )).toBe(true);
  });

  test('eq — no match on different value', () => {
    expect(evaluateCondition(
      { source: 'params', field: 'id', operator: 'eq', value: '1' },
      {}, {}, {}, { id: '99' }
    )).toBe(false);
  });

  test('exists — param present', () => {
    expect(evaluateCondition(
      { source: 'params', field: 'orderId', operator: 'exists' },
      {}, {}, {}, { orderId: 'abc' }
    )).toBe(true);
  });

  test('exists — param absent → false', () => {
    expect(evaluateCondition(
      { source: 'params', field: 'orderId', operator: 'exists' },
      {}, {}, {}, {}
    )).toBe(false);
  });

  test('neq — different param value', () => {
    expect(evaluateCondition(
      { source: 'params', field: 'id', operator: 'neq', value: 'admin' },
      {}, {}, {}, { id: 'guest' }
    )).toBe(true);
  });

  test('regex — matches param pattern', () => {
    expect(evaluateCondition(
      { source: 'params', field: 'id', operator: 'regex', value: '^\\d+$' },
      {}, {}, {}, { id: '42' }
    )).toBe(true);
  });
});

// ─── Integration: selectResponse — params source conditions ───────────────────

describe('selectResponse — params source conditions', () => {
  const endpoint = {
    id: 'demo', method: 'GET', path: '/api/demo/:id',
    responses: [
      {
        label: 'SpecialItem',
        status: 200,
        body: { message: 'Special response for id=1' },
        isDefault: false,
        conditions: [{ source: 'params', field: 'id', operator: 'eq', value: '1' }]
      },
      {
        label: 'Default',
        status: 200,
        body: { message: 'Generic response' },
        isDefault: true,
        conditions: []
      }
    ]
  };

  test('id=1 in params → SpecialItem response', () => {
    const result = selectResponse(endpoint, {}, {}, { id: '1' }, {});
    expect(result.label).toBe('SpecialItem');
    expect(result.status).toBe(200);
  });

  test('id=99 in params → Default response (no match)', () => {
    const result = selectResponse(endpoint, {}, {}, { id: '99' }, {});
    expect(result.label).toBe('Default');
  });

  test('empty params → Default response', () => {
    const result = selectResponse(endpoint, {}, {}, {}, {});
    expect(result.label).toBe('Default');
  });

  test('params condition takes Priority 0 over ?__code', () => {
    const result = selectResponse(endpoint, { __code: '404' }, {}, { id: '1' }, {});
    expect(result.label).toBe('SpecialItem');
  });

  test('params + body conditions combined (AND logic)', () => {
    const ep = {
      id: 'combo', method: 'POST', path: '/api/orders/:id/confirm',
      responses: [
        {
          label: 'Confirmed',
          status: 200,
          body: { confirmed: true },
          conditions: [
            { source: 'params', field: 'id', operator: 'eq', value: '5' },
            { source: 'body', field: 'action', operator: 'eq', value: 'confirm' }
          ]
        },
        { label: 'Default', status: 400, body: { error: 'bad' }, isDefault: true }
      ]
    };
    // Both match
    expect(selectResponse(ep, {}, {}, { id: '5' }, { action: 'confirm' }).label).toBe('Confirmed');
    // Only params match, body mismatch → Default
    expect(selectResponse(ep, {}, {}, { id: '5' }, { action: 'cancel' }).label).toBe('Default');
    // Only body match, params mismatch → Default
    expect(selectResponse(ep, {}, {}, { id: '9' }, { action: 'confirm' }).label).toBe('Default');
  });
});
