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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  colors,
  formatDate,
  priorityLabels,
  priorityColors,
  projectStatusLabels,
  projectStatusColors,
  projectColors,
  generateId,
} from '@/lib/utils';
import { Project, Priority, ProjectStatus } from '@/types';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, addProject, updateProject, removeProject, loading } = useProjects();
  const { tasks } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [priority, setPriority] = useState<Priority>('medium');
  const [color, setColor] = useState(projectColors[0]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('active');
    setPriority('medium');
    setColor(projectColors[0]);
    setEditingProject(null);
  };

  const openEditForm = (project: Project) => {
    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
    setPriority(project.priority);
    setColor(project.color);
    setEditingProject(project);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du projet est requis');
      return;
    }

    const now = new Date().toISOString();
    const projectData: Project = {
      id: editingProject?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: null,
      color,
      createdAt: editingProject?.createdAt || now,
      updatedAt: now,
    };

    if (editingProject) {
      await updateProject(projectData);
    } else {
      await addProject(projectData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (project: Project) => {
    Alert.alert(
      'Supprimer le projet',
      `Êtes-vous sûr de vouloir supprimer "${project.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeProject(project.id),
        },
      ]
    );
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
        <Text style={styles.title}>Projets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un projet..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun projet trouvé' : 'Aucun projet créé'}
            </Text>
          </View>
        ) : (
          filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
            const progress = projectTasks.length > 0
              ? Math.round((completedCount / projectTasks.length) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => router.push(`/project/${project.id}`)}
                onLongPress={() => openEditForm(project)}
              >
                <View style={[styles.projectColorBar, { backgroundColor: project.color }]} />
                <View style={styles.projectContent}>
                  <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description || 'Aucune description'}
                  </Text>
                  <View style={styles.projectMeta}>
                    <View style={[styles.badge, { backgroundColor: projectStatusColors[project.status].bg }]}>
                      <Text style={[styles.badgeText, { color: projectStatusColors[project.status].text }]}>
                        {projectStatusLabels[project.status]}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: priorityColors[project.priority].bg }]}>
                      <Text style={[styles.badgeText, { color: priorityColors[project.priority].text }]}>
                        {priorityLabels[project.priority]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: project.color }]} />
                    </View>
                    <Text style={styles.progressText}>{completedCount}/{projectTasks.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(project)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Project Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.saveText}>{editingProject ? 'Modifier' : 'Créer'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Nom du projet *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mon nouveau projet"
              placeholderTextColor={colors.gray[400]}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description du projet..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Statut</Text>
            <View style={styles.optionsRow}>
              {(Object.entries(projectStatusLabels) as [ProjectStatus, string][]).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButton, status === value && styles.optionButtonActive]}
                  onPress={() => setStatus(value)}
                >
                  <Text style={[styles.optionText, status === value && styles.optionTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Priorité</Text>
            <View style={styles.optionsRow}>
              {(Object.entries(priorityLabels) as [Priority, string][]).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButton, priority === value && styles.optionButtonActive]}
                  onPress={() => setPriority(value)}
                >
                  <Text style={[styles.optionText, priority === value && styles.optionTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Couleur</Text>
            <View style={styles.colorRow}>
              {projectColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorButton,
                    { backgroundColor: c },
                    color === c && styles.colorButtonActive,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
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
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
    flexDirection: 'row',
  },
  projectColorBar: {
    width: 4,
  },
  projectContent: {
    flex: 1,
    padding: 16,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  projectDescription: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[500],
    minWidth: 40,
    textAlign: 'right',
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
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
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: colors.gray[900],
  },
});
