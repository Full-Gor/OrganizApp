import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  colors,
  isOverdue,
  getRelativeDate,
  priorityColors,
  statusLabels,
  projectStatusColors,
  projectStatusLabels,
} from '@/lib/utils';

export default function DashboardScreen() {
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    ).length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;

    return {
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [projects, tasks]);

  const urgentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        const aOverdue = a.dueDate && isOverdue(a.dueDate);
        const bOverdue = b.dueDate && isOverdue(b.dueDate);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, 5);
  }, [tasks]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [projects]);

  if (projectsLoading || tasksLoading) {
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Vue d'ensemble de vos projets</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.blue[100] }]}>
              <Ionicons name="folder" size={20} color={colors.blue[500]} />
            </View>
            <Text style={styles.statValue}>{stats.activeProjects}</Text>
            <Text style={styles.statLabel}>Projets actifs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.green[50] }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green[500]} />
            </View>
            <Text style={styles.statValue}>{stats.completedTasks}/{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.yellow[50] }]}>
              <Ionicons name="time" size={20} color={colors.yellow[500]} />
            </View>
            <Text style={styles.statValue}>{stats.inProgressTasks}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stats.overdueTasks > 0 ? colors.red[50] : colors.gray[100] }]}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={stats.overdueTasks > 0 ? colors.red[500] : colors.gray[400]}
              />
            </View>
            <Text style={[styles.statValue, stats.overdueTasks > 0 && { color: colors.red[500] }]}>
              {stats.overdueTasks}
            </Text>
            <Text style={styles.statLabel}>En retard</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="trending-up" size={20} color={colors.primary} />
            <Text style={styles.progressTitle}>Progression globale</Text>
            <Text style={styles.progressPercent}>{stats.completionRate}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${stats.completionRate}%` }]} />
          </View>
        </View>

        {/* Urgent Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tâches urgentes</Text>
            <TouchableOpacity onPress={() => router.push('/projects')}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {urgentTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune tâche urgente</Text>
            </View>
          ) : (
            urgentTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const taskOverdue = task.dueDate && isOverdue(task.dueDate);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => router.push(`/project/${task.projectId}`)}
                >
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskProject} numberOfLines={1}>
                      {project?.name || 'Projet inconnu'}
                    </Text>
                  </View>
                  <View style={styles.taskMeta}>
                    <View style={[styles.badge, { backgroundColor: priorityColors[task.priority].bg }]}>
                      <Text style={[styles.badgeText, { color: priorityColors[task.priority].text }]}>
                        {statusLabels[task.status]}
                      </Text>
                    </View>
                    {task.dueDate && (
                      <Text style={[styles.taskDate, taskOverdue && { color: colors.red[500] }]}>
                        {getRelativeDate(task.dueDate)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projets récents</Text>
            <TouchableOpacity onPress={() => router.push('/projects')}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {recentProjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun projet créé</Text>
            </View>
          ) : (
            recentProjects.map((project) => {
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
                >
                  <View style={styles.projectHeader}>
                    <View style={[styles.projectDot, { backgroundColor: project.color }]} />
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                      <View style={styles.projectMeta}>
                        <View style={[styles.badge, { backgroundColor: projectStatusColors[project.status].bg }]}>
                          <Text style={[styles.badgeText, { color: projectStatusColors[project.status].text }]}>
                            {projectStatusLabels[project.status]}
                          </Text>
                        </View>
                        <Text style={styles.projectTasks}>{completedCount}/{projectTasks.length} tâches</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.projectProgress}>
                    <View style={styles.progressBarBgSmall}>
                      <View style={[styles.progressBarFillSmall, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressPercentSmall}>{progress}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginLeft: 8,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
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
  sectionLink: {
    fontSize: 14,
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
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
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  taskContent: {
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  taskProject: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  taskDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  projectTasks: {
    fontSize: 12,
    color: colors.gray[500],
  },
  projectProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBgSmall: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillSmall: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressPercentSmall: {
    fontSize: 12,
    color: colors.gray[500],
    width: 36,
    textAlign: 'right',
  },
});
