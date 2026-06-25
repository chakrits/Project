import { useState } from 'react';
import { Plus, Search, Upload, Download, ChevronRight, ChevronDown, MoreHorizontal, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import MethodBadge from '../common/MethodBadge';
import CollectionModal from './CollectionModal';

export default function EndpointList({
  endpoints, collections, selectedId,
  onSelect, onAdd, onImport, onExport,
  onCreateCollection, onUpdateCollection, onDeleteCollection,
}) {
  const [filter, setFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [collectionFilter, setCollectionFilter] = useState('ALL');
  const [collapsed, setCollapsed] = useState(new Set());
  const [menuOpen, setMenuOpen] = useState(null); // collectionId of open menu
  const [modal, setModal] = useState({ isOpen: false, mode: 'create', collection: null });

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const filtered = endpoints.filter(ep => {
    const matchesSearch = !filter ||
      ep.path.toLowerCase().includes(filter.toLowerCase()) ||
      ep.description?.toLowerCase().includes(filter.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || ep.method === methodFilter;
    const matchesCollection = collectionFilter === 'ALL'
      || (collectionFilter === 'NONE' ? !ep.collectionId : ep.collectionId === collectionFilter);
    return matchesSearch && matchesMethod && matchesCollection;
  });

  // Build groups: collections in order, then Uncollected last
  const groups = [
    ...collections.map(c => ({
      id: c.id,
      label: c.name,
      color: c.color,
      endpoints: filtered.filter(ep => ep.collectionId === c.id),
    })),
    {
      id: null,
      label: 'Uncollected',
      color: null,
      endpoints: filtered.filter(ep => !ep.collectionId),
    },
  ].filter(g => g.endpoints.length > 0 || (collectionFilter === 'ALL' && g.id !== null && collections.find(c => c.id === g.id)));

  // If no collection filter is active show all non-empty groups + empty collections only when ALL selected
  const visibleGroups = collectionFilter === 'ALL'
    ? [
        ...collections.map(c => ({
          id: c.id,
          label: c.name,
          color: c.color,
          endpoints: filtered.filter(ep => ep.collectionId === c.id),
        })),
        { id: null, label: 'Uncollected', color: null, endpoints: filtered.filter(ep => !ep.collectionId) },
      ].filter(g => g.endpoints.length > 0 || g.id !== null)
    : [
        ...collections.map(c => ({
          id: c.id,
          label: c.name,
          color: c.color,
          endpoints: filtered.filter(ep => ep.collectionId === c.id),
        })),
        { id: null, label: 'Uncollected', color: null, endpoints: filtered.filter(ep => !ep.collectionId) },
      ].filter(g => g.endpoints.length > 0);

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openCreateModal = () => setModal({ isOpen: true, mode: 'create', collection: null });
  const openRenameModal = (col) => { setMenuOpen(null); setModal({ isOpen: true, mode: 'edit', collection: col }); };
  const closeModal = () => setModal(m => ({ ...m, isOpen: false }));

  const handleModalConfirm = async (data) => {
    if (modal.mode === 'create') {
      await onCreateCollection(data);
    } else {
      await onUpdateCollection(modal.collection.id, data);
    }
    closeModal();
  };

  // Show flat list when collections are not in use
  const useGrouped = collections.length > 0 || endpoints.some(e => e.collectionId);

  return (
    <div className="flex flex-col h-full" onClick={() => menuOpen && setMenuOpen(null)}>
      {/* Header */}
      <div className="p-3 border-b border-border-default">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Endpoints</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                text-text-secondary hover:text-text-primary hover:bg-surface-hover
                text-xs font-medium transition-all cursor-pointer"
              title="New collection"
            >
              <FolderPlus size={13} />
            </button>
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

        {/* Collection filter dropdown */}
        {collections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <select
              value={collectionFilter}
              onChange={e => setCollectionFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-primary border border-border-default
                focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50
                text-xs text-text-primary cursor-pointer transition-colors"
            >
              <option value="ALL">All Collections</option>
              <option value="NONE">Uncollected</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-text-muted text-xs">
            {endpoints.length === 0 ? 'No endpoints yet' : 'No matching endpoints'}
          </div>
        )}

        {useGrouped ? (
          visibleGroups.map(group => (
            <div key={group.id ?? '__uncollected__'}>
              {/* Group header */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-primary/50 border-b border-border-subtle sticky top-0 group"
              >
                <button
                  onClick={() => toggleCollapse(group.id ?? '__uncollected__')}
                  className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                >
                  {collapsed.has(group.id ?? '__uncollected__')
                    ? <ChevronRight size={12} className="text-text-muted flex-shrink-0" />
                    : <ChevronDown size={12} className="text-text-muted flex-shrink-0" />
                  }
                  {group.color
                    ? <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                    : <span className="w-2 h-2 rounded-full bg-border-default flex-shrink-0" />
                  }
                  <span className="text-[11px] font-semibold text-text-secondary truncate">{group.label}</span>
                  <span className="text-[10px] text-text-muted ml-1 flex-shrink-0">{group.endpoints.length}</span>
                </button>

                {/* Three-dot menu for real collections */}
                {group.id !== null && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === group.id ? null : group.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                    {menuOpen === group.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-36 bg-surface-secondary border border-border-default rounded-lg shadow-xl z-20 py-1 animate-fade-in"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openRenameModal(collections.find(c => c.id === group.id))}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer"
                        >
                          <Pencil size={12} /> Rename
                        </button>
                        <button
                          onClick={() => { setMenuOpen(null); onDeleteCollection(group.id); }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Endpoints in group */}
              {!collapsed.has(group.id ?? '__uncollected__') && group.endpoints.map(ep => (
                <EndpointItem key={ep.id} ep={ep} selectedId={selectedId} onSelect={onSelect} />
              ))}
            </div>
          ))
        ) : (
          filtered.map(ep => (
            <EndpointItem key={ep.id} ep={ep} selectedId={selectedId} onSelect={onSelect} />
          ))
        )}
      </div>

      <CollectionModal
        isOpen={modal.isOpen}
        mode={modal.mode}
        collection={modal.collection}
        onConfirm={handleModalConfirm}
        onClose={closeModal}
      />
    </div>
  );
}

function EndpointItem({ ep, selectedId, onSelect }) {
  return (
    <button
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
  );
}
