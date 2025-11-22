import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/lib/utils';
import { sendMessageToGroq } from '@/lib/groq';
import { getAIContext, executeAIAction } from '@/lib/ai-actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'organizapp_ai_messages';
const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Bonjour ! Je suis l'assistant IA d'OrganizApp. Je peux vous aider à :\n\n• Créer des projets et tâches\n• Planifier des événements et RDV\n• Organiser votre travail\n• Ajouter des éléments de veille\n• Créer des rappels\n• Voir vos statistiques\n\nQue puis-je faire pour vous ?",
};

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Charger les messages depuis AsyncStorage au montage
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading AI messages:', e);
      }
      setIsInitialized(true);
    };
    loadMessages();
  }, []);

  // Sauvegarder les messages quand ils changent
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(console.error);
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const clearConversation = async () => {
    setMessages([INITIAL_MESSAGE]);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([INITIAL_MESSAGE]));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = await getAIContext();
      const data = await sendMessageToGroq(input.trim(), context);

      let assistantContent = data.response || data.message || "Je n'ai pas compris.";

      // Exécuter l'action si présente
      if (data.action && data.action !== 'message') {
        const result = await executeAIAction({ type: data.action, data: data.data });

        if (result.success) {
          if (data.action === 'get_stats' && result.data) {
            assistantContent += `\n\n📊 Statistiques:\n`;
            assistantContent += `• Projets actifs: ${result.data.activeProjects}/${result.data.totalProjects}\n`;
            assistantContent += `• Tâches terminées: ${result.data.completedTasks}/${result.data.totalTasks}\n`;
            assistantContent += `• En cours: ${result.data.inProgressTasks}\n`;
            assistantContent += `• Taux: ${result.data.completionRate}%`;
          } else if (data.action === 'list_projects' && result.data) {
            assistantContent += `\n\n📁 Projets:\n`;
            result.data.forEach((p: any) => {
              assistantContent += `• ${p.name} (${p.status})\n`;
            });
          } else if (data.action === 'list_tasks' && result.data) {
            assistantContent += `\n\n✅ Tâches:\n`;
            result.data.slice(0, 10).forEach((t: any) => {
              const icon = t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '⏳' : '○';
              assistantContent += `${icon} ${t.title}\n`;
            });
          } else if (data.action === 'create_event' && result.data) {
            const { task } = result.data;
            if (task && task.dueDate) {
              const date = new Date(task.dueDate);
              assistantContent += `\n\n📅 Événement ajouté au planning:\n`;
              assistantContent += `• ${task.title}\n`;
              assistantContent += `• Date: ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n`;
              if (task.description) {
                assistantContent += `• ${task.description}`;
              }
            }
          }
        } else {
          assistantContent = result.message;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Réessayez.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Crée un projet pour une app",
    "J'ai un RDV demain à 14h",
    "Mes statistiques",
    "Planifie une réunion lundi",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={24} color={colors.white} />
          </View>
          <View>
            <Text style={styles.title}>Assistant IA</Text>
            <Text style={styles.subtitle}>Toujours prêt à aider</Text>
          </View>
        </View>
        {messages.length > 1 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearConversation}>
            <Text style={styles.clearButtonText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  message.role === 'user' ? styles.userAvatar : styles.assistantAvatar,
                ]}
              >
                <Ionicons
                  name={message.role === 'user' ? 'person' : 'sparkles'}
                  size={16}
                  color={message.role === 'user' ? colors.primary : '#9333ea'}
                />
              </View>
              <View
                style={[
                  styles.messageContent,
                  message.role === 'user' ? styles.userContent : styles.assistantContent,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' && styles.userText,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={[styles.avatar, styles.assistantAvatar]}>
                <Ionicons name="sparkles" size={16} color="#9333ea" />
              </View>
              <View style={[styles.messageContent, styles.assistantContent]}>
                <ActivityIndicator size="small" color={colors.gray[400]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Suggestions :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionButton}
                  onPress={() => setInput(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Demandez-moi quelque chose..."
            placeholderTextColor={colors.gray[400]}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={input.trim() && !isLoading ? colors.white : colors.gray[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray[500],
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  userBubble: {
    flexDirection: 'row-reverse',
  },
  assistantBubble: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: colors.blue[100],
  },
  assistantAvatar: {
    backgroundColor: '#f3e8ff',
  },
  messageContent: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userContent: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: colors.gray[100],
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.gray[800],
  },
  userText: {
    color: colors.white,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.gray[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
});
