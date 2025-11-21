'use client';

import { useState, useMemo } from 'react';
import { useWatchItems } from '@/hooks/useStore';
import {
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  MoreVertical,
  Tag,
  Filter,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Modal from '@/components/Modal';
import WatchItemForm from '@/components/WatchItemForm';
import { WatchItem } from '@/types';

const categoryColors: Record<string, string> = {
  Article: 'bg-blue-100 text-blue-700',
  Tutoriel: 'bg-green-100 text-green-700',
  Outil: 'bg-purple-100 text-purple-700',
  Bibliothèque: 'bg-yellow-100 text-yellow-700',
  Framework: 'bg-red-100 text-red-700',
  Idée: 'bg-pink-100 text-pink-700',
  Ressource: 'bg-cyan-100 text-cyan-700',
  Autre: 'bg-gray-100 text-gray-700',
};

export default function WatchPage() {
  const { watchItems, removeWatchItem, loading } = useWatchItems();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WatchItem | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    watchItems.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [watchItems]);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    watchItems.forEach((item) => categories.add(item.category));
    return Array.from(categories).sort();
  }, [watchItems]);

  const filteredItems = useMemo(() => {
    return watchItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesTag = filterTag === 'all' || item.tags.includes(filterTag);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [watchItems, searchQuery, filterCategory, filterTag]);

  const handleDelete = () => {
    if (confirmDelete) {
      removeWatchItem(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veille & Idées</h1>
          <p className="text-gray-500 mt-1">
            {watchItems.length} élément(s) sauvegardé(s)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter une idée
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Toutes catégories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">
            {searchQuery || filterCategory !== 'all' || filterTag !== 'all'
              ? 'Aucun élément ne correspond à vos critères'
              : 'Aucune idée sauvegardée'}
          </p>
          {!searchQuery && filterCategory === 'all' && filterTag === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Ajouter votre première idée
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'inline-block text-xs px-2 py-0.5 rounded-full mb-2',
                        categoryColors[item.category] || categoryColors['Autre']
                      )}
                    >
                      {item.category}
                    </span>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.title}
                    </h3>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuOpen === item.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setMenuOpen(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete(item);
                            setMenuOpen(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                    {item.description}
                  </p>
                )}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le lien
                  </a>
                )}

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  Ajouté le {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm || !!editingItem}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Modifier l\'élément' : 'Nouvelle idée'}
        size="lg"
      >
        <WatchItemForm
          item={editingItem || undefined}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer l'élément"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer &quot;{confirmDelete?.title}&quot; ?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
