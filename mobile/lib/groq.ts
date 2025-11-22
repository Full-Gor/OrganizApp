// Clé API Groq
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches.

IMPORTANT: Réponds TOUJOURS avec UN SEUL objet JSON valide.

== PLANIFIER PLUSIEURS RDV (PRIORITAIRE si 2+ événements) ==
{"action": "plan_day", "data": {
  "date": "2024-01-15",
  "events": [
    {"title": "RDV Médecin", "time": "09:30", "duration": 45, "travelTime": 20},
    {"title": "RDV Dentiste", "time": "14:00", "duration": 30, "travelTime": 15}
  ]
}, "response": "📅 Planning OK !"}

== CRÉER UN SEUL ÉVÉNEMENT ==
{"action": "create_event", "data": {"title": "RDV", "time": "14:00", "duration": 60, "travelTime": 30}, "response": "Départ 13:30, fin 15:00"}

== MODIFIER/SUPPRIMER ==
- update_event: {"action": "update_event", "data": {"eventName": "RDV", "time": "15:00"}, "response": "Décalé !"}
- delete_event: {"action": "delete_event", "data": {"eventName": "RDV"}, "response": "Supprimé !"}

== AUTRES ACTIONS ==
- create_project, create_task, delete_task, complete_task
- list_projects, list_tasks, list_events, get_stats, search, message

== RÈGLES IMPORTANTES ==
1. PLUSIEURS RDV dans le même message → TOUJOURS "plan_day" avec tableau events
2. UN SEUL RDV → "create_event"
3. Durées: "1h30" = 90min, "1h15" = 75min
4. Détection conflit automatique si événements se chevauchent
5. "décale/modifie" → update_event
6. "nan/non" → {"action": "message", "response": "OK"}

DATE: ${new Date().toISOString().split('T')[0]}

CONTEXTE:
{context}

EXEMPLES:
- "RDV médecin 9h30 trajet 20min durée 45min, puis dentiste 14h" → {"action": "plan_day", "data": {"events": [{"title": "Médecin", "time": "09:30", "duration": 45, "travelTime": 20}, {"title": "Dentiste", "time": "14:00", "duration": 30, "travelTime": 0}]}, "response": "Planning OK !"}
- "RDV coiffeur 14h durée 1h, banque 14h30" → CONFLIT détecté !
- "RDV enfants 14h15 trajet 30min durée 1h15" → {"action": "create_event", "data": {"title": "RDV Enfants", "time": "14:15", "duration": 75, "travelTime": 30}, "response": "Départ 13:45"}`;

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
