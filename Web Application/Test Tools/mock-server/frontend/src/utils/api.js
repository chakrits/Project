/**
 * API utility functions for the Mock Server Management API.
 * All endpoints are relative — works with both Vite proxy (dev) and Express (prod).
 */

const BASE = '/api/mock-server';

// ─── Endpoints CRUD ─────────────────────────────

export async function fetchEndpoints() {
  const res = await fetch(`${BASE}/endpoints`);
  if (!res.ok) throw new Error('Failed to fetch endpoints');
  return res.json();
}

export async function fetchEndpoint(id) {
  const res = await fetch(`${BASE}/endpoints/${id}`);
  if (!res.ok) throw new Error('Failed to fetch endpoint');
  return res.json();
}

export async function createEndpoint(data) {
  const res = await fetch(`${BASE}/endpoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create endpoint');
  }
  return res.json();
}

export async function updateEndpoint(id, data) {
  const res = await fetch(`${BASE}/endpoints/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update endpoint');
  }
  return res.json();
}

export async function deleteEndpoint(id) {
  const res = await fetch(`${BASE}/endpoints/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete endpoint');
  return res.json();
}

// ─── Logs ────────────────────────────────────────

export async function fetchLogs() {
  const res = await fetch(`${BASE}/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function clearLogs() {
  const res = await fetch(`${BASE}/logs`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear logs');
  return res.json();
}

// ─── Import / Export ─────────────────────────────

export async function importPreview(content, format = 'auto') {
  const res = await fetch(`${BASE}/import/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, format })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to preview import');
  }
  return res.json();
}

export async function importEndpoints(content, format = 'auto', strategy = 'merge') {
  const res = await fetch(`${BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, format, strategy })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to import');
  }
  return res.json();
}

export async function exportEndpoints() {
  const res = await fetch(`${BASE}/export`);
  if (!res.ok) throw new Error('Failed to export');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mock-endpoints.json';
  a.click();
  URL.revokeObjectURL(url);
}
