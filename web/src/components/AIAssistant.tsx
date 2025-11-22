'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAIContext, executeAIAction } from '@/lib/ai-actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'organizapp_ai_messages';
const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Bonjour ! Je suis l'assistant IA d'OrganizApp. Je peux vous aider à :\n\n• Créer des projets et des tâches\n• Planifier des événements et RDV\n• Organiser votre travail\n• Ajouter des éléments de veille\n• Créer des rappels\n• Voir vos statistiques\n\nQue puis-je faire pour vous ?",
  timestamp: new Date(),
};

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [INITIAL_MESSAGE];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
  } catch (e) {
    console.error('Error loading AI messages:', e);
  }
  return [INITIAL_MESSAGE];
}

function saveMessages(messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving AI messages:', e);
  }
}

export default function AIAssistant({ onAction }: { onAction?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les messages depuis localStorage au montage
  useEffect(() => {
    const loaded = loadMessages();
    setMessages(loaded);
    setIsInitialized(true);
  }, []);

  // Sauvegarder les messages quand ils changent
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = getAIContext();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), context }),
      });

      const data = await response.json();

      let assistantContent = data.response || data.message || "Je n'ai pas compris.";

      // Gérer les actions multiples (format "actions": [...])
      if (data.actions && Array.isArray(data.actions)) {
        let successCount = 0;
        for (const actionItem of data.actions) {
          const result = executeAIAction({ type: actionItem.action, data: actionItem.data });
          if (result.success) successCount++;
        }
        if (onAction) onAction();
      }
      // Exécuter l'action unique si présente
      else
      if (data.action && data.action !== 'message') {
        const result = executeAIAction({ type: data.action, data: data.data });

        if (result.success) {
          // Ajouter les détails du résultat
          if (data.action === 'get_stats' && result.data) {
            assistantContent += `\n\n📊 **Statistiques:**\n`;
            assistantContent += `• Projets actifs: ${result.data.activeProjects}/${result.data.totalProjects}\n`;
            assistantContent += `• Tâches terminées: ${result.data.completedTasks}/${result.data.totalTasks}\n`;
            assistantContent += `• En cours: ${result.data.inProgressTasks}\n`;
            assistantContent += `• En attente: ${result.data.pendingTasks}\n`;
            assistantContent += `• Taux de complétion: ${result.data.completionRate}%`;
          } else if (data.action === 'list_projects' && result.data) {
            assistantContent += `\n\n📁 **Projets:**\n`;
            result.data.forEach((p: any) => {
              assistantContent += `• ${p.name} (${p.status})\n`;
            });
          } else if (data.action === 'list_tasks' && result.data) {
            assistantContent += `\n\n✅ **Tâches:**\n`;
            result.data.slice(0, 10).forEach((t: any) => {
              const statusIcon = t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '⏳' : '○';
              assistantContent += `${statusIcon} ${t.title}\n`;
            });
            if (result.data.length > 10) {
              assistantContent += `... et ${result.data.length - 10} autres`;
            }
          } else if (data.action === 'search' && result.data) {
            const { projects, tasks, watchItems } = result.data;
            assistantContent += `\n\n🔍 **Résultats:**\n`;
            if (projects.length > 0) {
              assistantContent += `\nProjets: ${projects.map((p: any) => p.name).join(', ')}`;
            }
            if (tasks.length > 0) {
              assistantContent += `\nTâches: ${tasks.map((t: any) => t.title).join(', ')}`;
            }
            if (watchItems.length > 0) {
              assistantContent += `\nVeille: ${watchItems.map((w: any) => w.title).join(', ')}`;
            }
            if (projects.length === 0 && tasks.length === 0 && watchItems.length === 0) {
              assistantContent += `Aucun résultat trouvé.`;
            }
          } else if (data.action === 'create_event' && result.data) {
            const { task } = result.data;
            if (task && task.dueDate) {
              const date = new Date(task.dueDate);
              assistantContent += `\n\n📅 **Événement ajouté au planning:**\n`;
              assistantContent += `• ${task.title}\n`;
              assistantContent += `• Date: ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n`;
              if (task.description) {
                assistantContent += `• ${task.description}`;
              }
            }
          } else if (data.action === 'plan_day' && result.data) {
            // Afficher le planning avec tous les événements
            assistantContent = result.message;
            if (result.data.tasks && result.data.tasks.length > 0) {
              assistantContent += `\n\n✅ ${result.data.tasks.length} événement(s) ajouté(s) au planning !`;
            }
          }

          // Rafraîchir l'interface
          if (onAction) onAction();
        } else {
          assistantContent = result.message;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Vérifiez votre connexion et réessayez.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    saveMessages([INITIAL_MESSAGE]);
  };

  const suggestions = [
    "Crée un projet pour une app mobile",
    "J'ai un RDV demain à 14h",
    "Quelles sont mes statistiques ?",
    "Planifie une réunion lundi",
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-24 lg:bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
          'flex items-center justify-center hover:scale-110 transition-transform',
          isOpen && 'hidden'
        )}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 lg:bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Assistant IA</h3>
                <p className="text-xs text-white/80">Toujours prêt à aider</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={clearConversation}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors text-xs px-2"
                  title="Effacer la conversation"
                >
                  Effacer
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'user'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-purple-100 text-purple-600'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Demandez-moi quelque chose..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  input.trim() && !isLoading
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
