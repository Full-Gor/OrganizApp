// Clé API Groq
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches.

IMPORTANT: Réponds TOUJOURS avec UN SEUL objet JSON valide.

== CRÉER UN ÉVÉNEMENT/RDV ==
{"action": "create_event", "data": {
  "title": "RDV Médecin",
  "date": "2024-01-15",
  "time": "14:00",
  "duration": 60,
  "travelTime": 30,
  "location": "Cabinet Dr. Martin"
}, "response": "RDV ajouté ! Départ à 13:30, fin à 15:00"}

== MODIFIER UN ÉVÉNEMENT ==
{"action": "update_event", "data": {"eventName": "RDV", "time": "15:00"}, "response": "Décalé à 15h !"}

== SUPPRIMER UN ÉVÉNEMENT ==
{"action": "delete_event", "data": {"eventName": "RDV"}, "response": "Événement supprimé !"}

== AUTRES ACTIONS ==
- create_project: {"action": "create_project", "data": {"name": "Nom", "tasks": ["Tâche 1"]}, "response": "..."}
- create_task: {"action": "create_task", "data": {"title": "Titre", "projectName": "Projet"}, "response": "..."}
- delete_task/delete_project: {"action": "...", "data": {"taskName/projectName": "Nom"}, "response": "..."}
- complete_task: {"action": "complete_task", "data": {"taskName": "Nom"}, "response": "..."}
- list_projects/list_tasks/list_events/get_stats: {"action": "...", "data": {}, "response": "..."}
- create_watch_item: {"action": "create_watch_item", "data": {"title": "...", "url": "..."}, "response": "..."}
- search: {"action": "search", "data": {"query": "terme"}, "response": "..."}
- message: {"action": "message", "response": "Réponse"}

== RÈGLES ==
1. RDV/réunion/événement → "create_event"
2. "décale/modifie" → "update_event"
3. "annule/supprime" → "delete_event" ou "delete_task"
4. "nan/non" → {"action": "message", "response": "OK"}
5. Durées: "1h30" = 90min, "1h15" = 75min

DATE: ${new Date().toISOString().split('T')[0]}

CONTEXTE:
{context}

EXEMPLES:
- "RDV 14h15, trajet 30min, durée 1h15" → {"action": "create_event", "data": {"title": "RDV", "time": "14:15", "duration": 75, "travelTime": 30}, "response": "Départ: 13:45, fin: 15:30"}
- "Décale à 10h30" → {"action": "update_event", "data": {"eventName": "...", "time": "10:30"}, "response": "Décalé !"}
- "Supprime" → {"action": "delete_event", "data": {"eventName": "..."}, "response": "Supprimé !"}`;

export async function sendMessageToGroq(message: string, context: any): Promise<any> {
  if (GROQ_API_KEY === 'gsk_votre_cle_api_groq') {
    return {
      action: 'message',
      message: "⚠️ Clé API Groq non configurée. Modifiez le fichier mobile/lib/groq.ts avec votre clé API.",
      response: "⚠️ Clé API Groq non configurée. Modifiez le fichier mobile/lib/groq.ts avec votre clé API."
    };
  }

  try {
    const systemPrompt = SYSTEM_PROMPT.replace('{context}', JSON.stringify(context, null, 2));

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      return {
        action: 'message',
        message: `Erreur API Groq: ${response.status}`,
        response: `Erreur API Groq: ${response.status}`
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    try {
      return JSON.parse(aiResponse);
    } catch {
      return {
        action: 'message',
        message: aiResponse,
        response: aiResponse
      };
    }
  } catch (error) {
    return {
      action: 'message',
      message: "Erreur de connexion. Vérifiez votre connexion internet.",
      response: "Erreur de connexion. Vérifiez votre connexion internet."
    };
  }
}
