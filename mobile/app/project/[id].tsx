import React, { useState, useMemo, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  colors,
  isOverdue,
  getRelativeDate,
  priorityLabels,
  priorityColors,
  statusLabels,
  statusColors,
  projectStatusLabels,
  projectStatusColors,
  generateId,
} from '@/lib/utils';
import { Task, TaskStatus, Priority, SubTask } from '@/types';
import * as storage from '@/lib/storage';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { projects, removeProject } = useProjects();
  const { tasks, addTask, updateTask, removeTask, refresh: refreshTasks } = useTasks(id);

  const [project, setProject] = useState(projects.find((p) => p.id === id));
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('pending');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      const p = await storage.getProject(id!);
      if (p) setProject(p);
    };
    loadProject();
  }, [id, projects]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    ).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskStatus('pending');
    setTaskPriority('medium');
    setSubtasks([]);
    setNewSubtask('');
    setEditingTask(null);
  };

  const openTaskEdit = (task: Task) => {
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setSubtasks(task.subtasks);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleSubmitTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    const now = new Date().toISOString();
    const taskData: Task = {
      id: editingTask?.id || generateId(),
      projectId: id!,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      status: taskStatus,
      dueDate: null,
      subtasks,
      createdAt: editingTask?.createdAt || now,
      updatedAt: now,
    };

    if (editingTask) {
      await updateTask(taskData);
    } else {
      await addTask(taskData);
    }

    setShowTaskForm(false);
    resetTaskForm();
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask({ ...task, status: newStatus, updatedAt: new Date().toISOString() });
  };

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTask({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert('Supprimer', `Supprimer "${task.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeTask(task.id) },
    ]);
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Supprimer le projet',
      'Cette action supprimera également toutes les tâches associées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removeProject(id!);
            router.back();
          },
        },
      ]
    );
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const addSubtaskItem = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        { id: generateId(), title: newSubtask.trim(), completed: false, createdAt: new Date().toISOString() },
      ]);
      setNewSubtask('');
    }
  };

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Projet non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: project.name,
          headerTintColor: colors.primary,
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteProject} style={{ marginRight: 8 }}>
              <Ionicons name="trash-outline" size={22} color={colors.red[500]} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Project Info */}
          <View style={styles.projectHeader}>
            <View style={[styles.colorDot, { backgroundColor: project.color }]} />
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectDescription}>
                {project.description || 'Aucune description'}
              </Text>
              <View style={styles.badgesRow}>
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
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.green[600] }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Terminées</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.blue[600] }]}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>En cours</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, stats.overdue > 0 && { color: colors.red[500] }]}>
                {stats.overdue}
              </Text>
              <Text style={styles.statLabel}>En retard</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: project.color }]} />
            </View>
          </View>

          {/* Tasks Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tâches</Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => { resetTaskForm(); setShowTaskForm(true); }}
              >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.addTaskText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {tasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Aucune tâche</Text>
              </View>
            ) : (
              tasks.map((task) => {
                const taskOverdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed';
                const isExpanded = expandedTasks.has(task.id);
                const hasSubtasks = task.subtasks.length > 0;
                const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

                return (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskRow}>
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          task.status === 'completed' && styles.checkboxChecked,
                        ]}
                        onPress={() => handleToggleStatus(task)}
                      >
                        {task.status === 'completed' && (
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.taskContent} onPress={() => openTaskEdit(task)}>
                        <View style={styles.taskTitleRow}>
                          {hasSubtasks && (
                            <TouchableOpacity onPress={() => toggleExpand(task.id)}>
                              <Ionicons
                                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                size={16}
                                color={colors.gray[400]}
                              />
                            </TouchableOpacity>
                          )}
                          <Text
                            style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleCompleted]}
                            numberOfLines={1}
                          >
                            {task.title}
                          </Text>
                        </View>
                        <View style={styles.taskMeta}>
                          <View style={[styles.smallBadge, { backgroundColor: statusColors[task.status].bg }]}>
                            <Text style={[styles.smallBadgeText, { color: statusColors[task.status].text }]}>
                              {statusLabels[task.status]}
                            </Text>
                          </View>
                          <View style={[styles.smallBadge, { backgroundColor: priorityColors[task.priority].bg }]}>
                            <Text style={[styles.smallBadgeText, { color: priorityColors[task.priority].text }]}>
                              {priorityLabels[task.priority]}
                            </Text>
                          </View>
                          {hasSubtasks && (
                            <Text style={styles.subtaskCount}>
                              {completedSubtasks}/{task.subtasks.length}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleDeleteTask(task)}>
                        <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                      </TouchableOpacity>
                    </View>

                    {/* Subtasks */}
                    {isExpanded && hasSubtasks && (
                      <View style={styles.subtasksList}>
                        {task.subtasks.map((subtask) => (
                          <TouchableOpacity
                            key={subtask.id}
                            style={styles.subtaskRow}
                            onPress={() => handleToggleSubtask(task, subtask.id)}
                          >
                            <View
                              style={[
                                styles.subtaskCheckbox,
                                subtask.completed && styles.subtaskCheckboxChecked,
                              ]}
                            >
                              {subtask.completed && (
                                <Ionicons name="checkmark" size={10} color={colors.white} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.subtaskTitle,
                                subtask.completed && styles.subtaskTitleCompleted,
                              ]}
                            >
                              {subtask.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Task Form Modal */}
        <Modal visible={showTaskForm} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setShowTaskForm(false); resetTaskForm(); }}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </Text>
              <TouchableOpacity onPress={handleSubmitTask}>
                <Text style={styles.saveText}>{editingTask ? 'Modifier' : 'Créer'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Titre de la tâche"
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Description..."
                placeholderTextColor={colors.gray[400]}
                multiline
              />

              <Text style={styles.label}>Statut</Text>
              <View style={styles.optionsRow}>
                {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.optionButton, taskStatus === value && styles.optionButtonActive]}
                    onPress={() => setTaskStatus(value)}
                  >
                    <Text style={[styles.optionText, taskStatus === value && styles.optionTextActive]}>
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
                    style={[styles.optionButton, taskPriority === value && styles.optionButtonActive]}
                    onPress={() => setTaskPriority(value)}
                  >
                    <Text style={[styles.optionText, taskPriority === value && styles.optionTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Sous-tâches</Text>
              {subtasks.map((subtask) => (
                <View key={subtask.id} style={styles.subtaskEditRow}>
                  <Text style={styles.subtaskEditText}>{subtask.title}</Text>
                  <TouchableOpacity onPress={() => setSubtasks(subtasks.filter((s) => s.id !== subtask.id))}>
                    <Ionicons name="close" size={16} color={colors.red[500]} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.subtaskInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  placeholder="Nouvelle sous-tâche..."
                  placeholderTextColor={colors.gray[400]}
                  onSubmitEditing={addSubtaskItem}
                />
                <TouchableOpacity style={styles.addSubtaskButton} onPress={addSubtaskItem}>
                  <Ionicons name="add" size={20} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
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
  projectHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  projectDescription: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: 8,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: colors.white,
    marginTop: 8,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addTaskText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emptyText: {
    color: colors.gray[500],
  },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.green[500],
    borderColor: colors.green[500],
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  subtaskCount: {
    fontSize: 11,
    color: colors.gray[500],
  },
  subtasksList: {
    marginTop: 12,
    marginLeft: 32,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[200],
    paddingLeft: 12,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subtaskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subtaskCheckboxChecked: {
    backgroundColor: colors.green[500],
    borderColor: colors.green[500],
  },
  subtaskTitle: {
    fontSize: 13,
    color: colors.gray[700],
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
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
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
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
    fontSize: 12,
    color: colors.gray[700],
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  subtaskEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[50],
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtaskEditText: {
    fontSize: 14,
    color: colors.gray[700],
    flex: 1,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addSubtaskButton: {
    backgroundColor: colors.gray[100],
    width: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
