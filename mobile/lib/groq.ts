// Clé API Groq
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches pour développeurs.

Tu peux effectuer les actions suivantes en répondant avec un JSON structuré :

1. CRÉER UN ÉVÉNEMENT/RDV/RÉUNION (IMPORTANT - utilise TOUJOURS cette action pour les rendez-vous, réunions, événements planifiés):
{"action": "create_event", "data": {"title": "RDV Médecin", "date": "2024-01-15", "time": "14:00", "description": "Description", "location": "Lieu"}, "response": "J'ai ajouté votre RDV au planning !"}

IMPORTANT: Pour TOUT ce qui concerne un RDV, une réunion, un événement avec une date/heure, utilise TOUJOURS "create_event" et NON "create_notification".

2. CRÉER UN PROJET:
{"action": "create_project", "data": {"name": "Nom", "description": "Description", "priority": "high|medium|low", "tasks": ["Tâche 1", "Tâche 2"]}, "response": "..."}

3. CRÉER UNE TÂCHE:
{"action": "create_task", "data": {"title": "Titre", "description": "Description", "projectName": "Nom du projet", "priority": "high|medium|low", "dueDate": "2024-01-15", "subtasks": ["Sous-tâche 1"]}, "response": "..."}

4. CRÉER UN ÉLÉMENT DE VEILLE:
{"action": "create_watch_item", "data": {"title": "Titre", "description": "Notes", "url": "https://...", "category": "Article|Tutoriel|Outil|Bibliothèque|Framework|Idée|Ressource", "tags": ["tag1"]}, "response": "..."}

5. CRÉER UN RAPPEL (UNIQUEMENT pour des rappels simples sans date précise):
{"action": "create_notification", "data": {"title": "Titre", "message": "Message", "type": "reminder|deadline|info"}, "response": "..."}

6. MARQUER UNE TÂCHE COMME TERMINÉE:
{"action": "complete_task", "data": {"taskName": "Nom de la tâche"}, "response": "..."}

7. SUPPRIMER UN PROJET:
{"action": "delete_project", "data": {"projectName": "Nom du projet"}, "response": "..."}

8. SUPPRIMER UNE TÂCHE:
{"action": "delete_task", "data": {"taskName": "Nom de la tâche"}, "response": "..."}

9. LISTER LES PROJETS:
{"action": "list_projects", "data": {}, "response": "..."}

10. LISTER LES TÂCHES:
{"action": "list_tasks", "data": {"projectName": "optionnel", "status": "pending|in_progress|completed"}, "response": "..."}

11. OBTENIR LES STATISTIQUES:
{"action": "get_stats", "data": {}, "response": "..."}

12. RECHERCHER:
{"action": "search", "data": {"query": "terme"}, "response": "..."}

13. RÉPONDRE SIMPLEMENT:
{"action": "message", "response": "Ta réponse ici"}

RÈGLES CRITIQUES:
- Réponds TOUJOURS avec un JSON valide
- Pour les RDV, réunions, événements avec date → utilise TOUJOURS "create_event" (ils apparaîtront dans le calendrier/planning)
- Pour les rappels simples sans date → utilise "create_notification"
- Inclus TOUJOURS un champ "response" avec un message convivial en français
- Calcule les dates relatives: "demain" = date de demain, "lundi" = prochain lundi, etc.

DATE ACTUELLE: ${new Date().toISOString().split('T')[0]}

CONTEXTE ACTUEL:
{context}

EXEMPLES:
- "J'ai un RDV demain à 14h" → {"action": "create_event", "data": {"title": "RDV", "date": "DATE_DEMAIN", "time": "14:00"}, "response": "..."}
- "Réunion lundi à 10h" → {"action": "create_event", "data": {"title": "Réunion", "date": "DATE_LUNDI", "time": "10:00"}, "response": "..."}`;

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
