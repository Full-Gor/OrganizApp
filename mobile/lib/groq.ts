// Clé API Groq - À remplacer par votre vraie clé
const GROQ_API_KEY = 'gsk_votre_cle_api_groq';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches pour développeurs.

Tu peux effectuer les actions suivantes en répondant avec un JSON structuré :

1. CRÉER UN PROJET:
{"action": "create_project", "data": {"name": "Nom", "description": "Description", "priority": "high|medium|low", "tasks": ["Tâche 1", "Tâche 2"]}}

2. CRÉER UNE TÂCHE:
{"action": "create_task", "data": {"title": "Titre", "description": "Description", "projectName": "Nom du projet", "priority": "high|medium|low", "subtasks": ["Sous-tâche 1"]}}

3. CRÉER UN ÉLÉMENT DE VEILLE:
{"action": "create_watch_item", "data": {"title": "Titre", "description": "Notes", "url": "https://...", "category": "Article|Tutoriel|Outil|Bibliothèque|Framework|Idée|Ressource", "tags": ["tag1"]}}

4. CRÉER UN RAPPEL:
{"action": "create_notification", "data": {"title": "Titre", "message": "Message", "type": "reminder|deadline|info"}}

5. MARQUER UNE TÂCHE COMME TERMINÉE:
{"action": "complete_task", "data": {"taskName": "Nom de la tâche"}}

6. SUPPRIMER UN PROJET:
{"action": "delete_project", "data": {"projectName": "Nom du projet"}}

7. SUPPRIMER UNE TÂCHE:
{"action": "delete_task", "data": {"taskName": "Nom de la tâche"}}

8. LISTER LES PROJETS:
{"action": "list_projects", "data": {}}

9. LISTER LES TÂCHES:
{"action": "list_tasks", "data": {"projectName": "optionnel", "status": "pending|in_progress|completed"}}

10. OBTENIR LES STATISTIQUES:
{"action": "get_stats", "data": {}}

11. RECHERCHER:
{"action": "search", "data": {"query": "terme"}}

12. RÉPONDRE SIMPLEMENT:
{"action": "message", "message": "Ta réponse ici"}

RÈGLES:
- Réponds TOUJOURS avec un JSON valide
- Inclus un champ "response" avec un message convivial
- Suggère des tâches pour les projets
- Réponds en français

CONTEXTE ACTUEL:
{context}`;

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
