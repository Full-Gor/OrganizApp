import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWatchItems } from '@/hooks/useStore';
import { colors, formatDate, generateId } from '@/lib/utils';
import { WatchItem } from '@/types';

const categoryColors: Record<string, { bg: string; text: string }> = {
  Article: { bg: colors.blue[100], text: colors.blue[600] },
  Tutoriel: { bg: colors.green[50], text: colors.green[600] },
  Outil: { bg: '#f3e8ff', text: '#9333ea' },
  Bibliothèque: { bg: colors.yellow[50], text: '#ca8a04' },
  Framework: { bg: colors.red[50], text: colors.red[600] },
  Idée: { bg: '#fce7f3', text: '#db2777' },
  Ressource: { bg: '#cffafe', text: '#0891b2' },
  Autre: { bg: colors.gray[100], text: colors.gray[600] },
};

const categories = ['Article', 'Tutoriel', 'Outil', 'Bibliothèque', 'Framework', 'Idée', 'Ressource', 'Autre'];

export default function WatchScreen() {
  const { watchItems, addWatchItem, updateWatchItem, removeWatchItem, loading } = useWatchItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const filteredItems = useMemo(() => {
    return watchItems.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [watchItems, searchQuery]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setCategory(categories[0]);
    setTags([]);
    setNewTag('');
    setEditingItem(null);
  };

  const openEditForm = (item: WatchItem) => {
    setTitle(item.title);
    setDescription(item.description);
    setUrl(item.url || '');
    setCategory(item.category);
    setTags(item.tags);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    const itemData: WatchItem = {
      id: editingItem?.id || generateId(),
      title: title.trim(),
      description: description.trim(),
      url: url.trim() || null,
      category,
      tags,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    if (editingItem) {
      await updateWatchItem(itemData);
    } else {
      await addWatchItem(itemData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (item: WatchItem) => {
    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeWatchItem(item.id) },
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const openUrl = (urlToOpen: string) => {
    Linking.openURL(urlToOpen);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Veille & Idées</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { resetForm(); setShowForm(true); }}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bulb-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun élément trouvé' : 'Aucune idée sauvegardée'}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => openEditForm(item)}
            >
              <View style={styles.itemHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColors[item.category]?.bg || colors.gray[100] }]}>
                  <Text style={[styles.categoryText, { color: categoryColors[item.category]?.text || colors.gray[600] }]}>
                    {item.category}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
              )}

              {item.url && (
                <TouchableOpacity style={styles.urlButton} onPress={() => openUrl(item.url!)}>
                  <Ionicons name="link" size={14} color={colors.primary} />
                  <Text style={styles.urlText}>Voir le lien</Text>
                </TouchableOpacity>
              )}

              {item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.dateText}>Ajouté le {formatDate(item.createdAt)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Modifier' : 'Nouvelle idée'}
            </Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.saveText}>{editingItem ? 'Modifier' : 'Créer'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre de l'idée"
              placeholderTextColor={colors.gray[400]}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Notes ou description..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>URL (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://..."
              placeholderTextColor={colors.gray[400]}
              keyboardType="url"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagEdit}
                  onPress={() => setTags(tags.filter((t) => t !== tag))}
                >
                  <Text style={styles.tagEditText}>{tag}</Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Ajouter un tag..."
                placeholderTextColor={colors.gray[400]}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Text style={styles.addTagText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.gray[900],
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emptyText: {
    color: colors.gray[500],
    marginTop: 12,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  itemDescription: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  urlText: {
    fontSize: 14,
    color: colors.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: colors.gray[600],
  },
  dateText: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  cancelText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    color: colors.gray[900],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: 8,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  categoryOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagEditText: {
    fontSize: 13,
    color: colors.primary,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addTagText: {
    fontSize: 14,
    color: colors.gray[700],
  },
});
