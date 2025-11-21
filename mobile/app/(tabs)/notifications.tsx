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
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useStore';
import { colors, formatDateTime, generateId } from '@/lib/utils';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    loading,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'reminder' | 'deadline' | 'info'>('reminder');

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => filter === 'all' || !n.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('reminder');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    const notification: Notification = {
      id: generateId(),
      title: title.trim(),
      message: message.trim(),
      type,
      read: false,
      relatedId: null,
      relatedType: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await addNotification(notification);
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (notification: Notification) => {
    Alert.alert(
      'Supprimer',
      'Supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeNotification(notification.id) },
      ]
    );
  };

  const getNotificationIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'deadline':
        return { name: 'alert-circle', color: colors.yellow[500] };
      case 'reminder':
        return { name: 'time', color: colors.blue[500] };
      default:
        return { name: 'information-circle', color: colors.gray[500] };
    }
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
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes lues'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { resetForm(); setShowForm(true); }}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              Toutes ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
              Non lues ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
                onPress={() => markAsRead(notification.id)}
                onLongPress={() => handleDelete(notification)}
              >
                <View style={styles.notificationIcon}>
                  <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, !notification.read && styles.notificationTitleUnread]}>
                    {notification.title}
                  </Text>
                  {notification.message && (
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                  )}
                  <Text style={styles.notificationDate}>
                    {formatDateTime(notification.createdAt)}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.read && <View style={styles.unreadDot} />}
                  <TouchableOpacity onPress={() => handleDelete(notification)}>
                    <Ionicons name="trash-outline" size={18} color={colors.gray[400]} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Créer un rappel</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.saveText}>Créer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre du rappel"
              placeholderTextColor={colors.gray[400]}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Description..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {[
                { value: 'reminder', label: 'Rappel', icon: 'time' },
                { value: 'deadline', label: 'Échéance', icon: 'alert-circle' },
                { value: 'info', label: 'Info', icon: 'information-circle' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.typeOption, type === option.value && styles.typeOptionActive]}
                  onPress={() => setType(option.value as any)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={type === option.value ? colors.white : colors.gray[600]}
                  />
                  <Text style={[styles.typeOptionText, type === option.value && styles.typeOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
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
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: colors.white,
  },
  filterTabText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  filterTabTextActive: {
    color: colors.gray[900],
    fontWeight: '500',
  },
  markAllText: {
    fontSize: 13,
    color: colors.primary,
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
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  notificationCardUnread: {
    backgroundColor: colors.blue[50],
    borderColor: colors.blue[100],
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[700],
  },
  notificationTitleUnread: {
    fontWeight: '600',
    color: colors.gray[900],
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 8,
  },
  notificationActions: {
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  typeOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});
