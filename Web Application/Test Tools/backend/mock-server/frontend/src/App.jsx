import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/common/Header';
import EndpointList from './components/EndpointManager/EndpointList';
import EndpointEditor from './components/EndpointManager/EndpointEditor';
import ImportModal from './components/EndpointManager/ImportModal';
import ConfirmModal from './components/common/ConfirmModal';
import LogTable from './components/TrafficInspector/LogTable';
import LogDetail from './components/TrafficInspector/LogDetail';
import {
  fetchEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  fetchLogs,
  clearLogs,
  exportEndpoints,
  fetchCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from './utils/api';

/**
 * App — Root component with tab navigation between Endpoint Manager and Traffic Inspector
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('endpoints');

  // ─── Endpoint Manager State ─────────────────────────
  const [endpoints, setEndpoints] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState(null);
  const [isNewEndpoint, setIsNewEndpoint] = useState(false);
  const [endpointLoading, setEndpointLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: null });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // ─── Traffic Inspector State ────────────────────────
  const [logs, setLogs] = useState([]);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(null);

  // ─── Load Endpoints ─────────────────────────────────
  const loadEndpoints = useCallback(async () => {
    try {
      const data = await fetchEndpoints();
      setEndpoints(data);
    } catch (err) {
      console.error('Failed to load endpoints:', err);
    } finally {
      setEndpointLoading(false);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const data = await fetchCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  useEffect(() => {
    loadEndpoints();
    loadCollections();
  }, [loadEndpoints, loadCollections]);

  // ─── Load Logs ──────────────────────────────────────
  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'inspector') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  // ─── Auto-refresh for logs ──────────────────────────
  useEffect(() => {
    if (autoRefresh && activeTab === 'inspector') {
      autoRefreshRef.current = setInterval(loadLogs, 2000);
    }
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [autoRefresh, activeTab, loadLogs]);

  // ─── Endpoint Handlers ─────────────────────────────
  const handleAddEndpoint = () => {
    setSelectedEndpointId(null);
    setIsNewEndpoint(true);
  };

  const handleSelectEndpoint = (id) => {
    setSelectedEndpointId(id);
    setIsNewEndpoint(false);
  };

  const handleSaveEndpoint = async (data) => {
    if (isNewEndpoint) {
      const created = await createEndpoint(data);
      setEndpoints(prev => [...prev, created]);
      setSelectedEndpointId(created.id);
      setIsNewEndpoint(false);
    } else {
      const updated = await updateEndpoint(selectedEndpointId, data);
      setEndpoints(prev => prev.map(e => e.id === selectedEndpointId ? updated : e));
    }
  };

  const handleDeleteEndpoint = () => {
    if (!selectedEndpointId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Endpoint',
      message: 'Are you sure you want to delete this endpoint? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteEndpoint(selectedEndpointId);
        setEndpoints(prev => prev.filter(e => e.id !== selectedEndpointId));
        setSelectedEndpointId(null);
        closeConfirm();
      }
    });
  };

  const handleClearLogs = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Traffic Logs',
      message: 'All traffic logs will be permanently deleted.',
      confirmLabel: 'Clear',
      variant: 'danger',
      onConfirm: async () => {
        await clearLogs();
        setLogs([]);
        setSelectedTraceId(null);
        closeConfirm();
      }
    });
  };

  // ─── Collection Handlers ───────────────────────────
  const handleCreateCollection = async (data) => {
    const created = await createCollection(data);
    setCollections(prev => [...prev, created]);
    return created;
  };

  const handleUpdateCollection = async (id, data) => {
    const updated = await updateCollection(id, data);
    setCollections(prev => prev.map(c => c.id === id ? updated : c));
  };

  const handleDeleteCollection = (id) => {
    const col = collections.find(c => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Collection',
      message: `Delete "${col?.name}"? All endpoints in this collection will become uncollected.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteCollection(id);
        setCollections(prev => prev.filter(c => c.id !== id));
        setEndpoints(prev => prev.map(e => e.collectionId === id ? { ...e, collectionId: null } : e));
        closeConfirm();
      }
    });
  };

  // ─── Derived ────────────────────────────────────────
  const selectedEndpoint = isNewEndpoint
    ? { method: 'GET', path: '', description: '', responses: [{ label: 'Success', status: 200, body: {}, isDefault: true }] }
    : endpoints.find(e => e.id === selectedEndpointId);

  const selectedLog = logs.find(l => l.traceId === selectedTraceId);

  return (
    <div className="flex flex-col h-screen bg-surface-primary">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden">
        {/* ─── Endpoint Manager Tab ─── */}
        {activeTab === 'endpoints' && (
          <div className="flex h-full">
            {/* Sidebar */}
            <aside className="w-72 xl:w-80 border-r border-border-default bg-surface-secondary flex-shrink-0">
              {endpointLoading ? (
                <div className="flex items-center justify-center h-full text-text-muted text-sm">
                  Loading...
                </div>
              ) : (
                <EndpointList
                  endpoints={endpoints}
                  collections={collections}
                  selectedId={selectedEndpointId}
                  onSelect={handleSelectEndpoint}
                  onAdd={handleAddEndpoint}
                  onImport={() => setShowImportModal(true)}
                  onExport={exportEndpoints}
                  onCreateCollection={handleCreateCollection}
                  onUpdateCollection={handleUpdateCollection}
                  onDeleteCollection={handleDeleteCollection}
                />
              )}
            </aside>

            {/* Editor */}
            <section className="flex-1 bg-surface-secondary/50">
              {selectedEndpoint ? (
                <EndpointEditor
                  key={isNewEndpoint ? '__new__' : selectedEndpointId}
                  endpoint={selectedEndpoint}
                  collections={collections}
                  onSave={handleSaveEndpoint}
                  onDelete={handleDeleteEndpoint}
                  isNew={isNewEndpoint}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                  <div className="text-5xl mb-4">🛠️</div>
                  <p className="text-sm font-medium">Select an endpoint to edit</p>
                  <p className="text-xs mt-1">Or click <strong className="text-accent">+ New</strong> to create one</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ─── Traffic Inspector Tab ─── */}
        {activeTab === 'inspector' && (
          <div className="flex h-full">
            {/* Log table */}
            <section className={`${selectedTraceId ? 'w-1/2 xl:w-2/5' : 'w-full'} border-r border-border-default transition-all`}>
              <LogTable
                logs={logs}
                selectedTraceId={selectedTraceId}
                onSelect={setSelectedTraceId}
                onRefresh={loadLogs}
                onClear={handleClearLogs}
                autoRefresh={autoRefresh}
                onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
              />
            </section>

            {/* Log detail */}
            {selectedTraceId && (
              <section className="flex-1">
                <LogDetail
                  log={selectedLog}
                  onClose={() => setSelectedTraceId(null)}
                />
              </section>
            )}
          </div>
        )}
      </main>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        collections={collections}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          loadEndpoints();
          loadCollections();
          setShowImportModal(false);
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
}
