import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches pour développeurs.

Tu peux effectuer les actions suivantes en répondant avec un JSON structuré :

1. CRÉER UN PROJET:
{"action": "create_project", "data": {"name": "Nom", "description": "Description", "priority": "high|medium|low", "tasks": ["Tâche 1", "Tâche 2"]}}

2. CRÉER UNE TÂCHE:
{"action": "create_task", "data": {"title": "Titre", "description": "Description", "projectName": "Nom du projet", "priority": "high|medium|low", "subtasks": ["Sous-tâche 1", "Sous-tâche 2"]}}

3. CRÉER UN ÉLÉMENT DE VEILLE:
{"action": "create_watch_item", "data": {"title": "Titre", "description": "Notes", "url": "https://...", "category": "Article|Tutoriel|Outil|Bibliothèque|Framework|Idée|Ressource", "tags": ["tag1", "tag2"]}}

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
{"action": "search", "data": {"query": "terme de recherche"}}

12. RÉPONDRE SIMPLEMENT (pour les questions ou conversations):
{"action": "message", "message": "Ta réponse ici"}

RÈGLES IMPORTANTES:
- Réponds TOUJOURS avec un JSON valide
- Pour les actions, inclus aussi un champ "response" avec un message convivial pour l'utilisateur
- Quand on te demande de créer un projet, suggère automatiquement des tâches pertinentes
- Quand on te demande de créer une tâche complexe, suggère des sous-tâches
- Sois proactif et utile
- Réponds en français

CONTEXTE ACTUEL DE L'APPLICATION:
{context}

Exemple de réponse pour créer un projet:
{"action": "create_project", "data": {"name": "Site E-commerce", "description": "Refonte complète du site", "priority": "high", "tasks": ["Maquettes UI/UX", "Intégration frontend", "API backend", "Tests", "Déploiement"]}, "response": "J'ai créé le projet 'Site E-commerce' avec 5 tâches pour bien démarrer !"}`;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'gsk_votre_cle_api_groq') {
      return NextResponse.json({
        action: 'message',
        message: "⚠️ Clé API Groq non configurée. Ajoutez votre clé dans le fichier .env.local (GROQ_API_KEY=gsk_...)",
        response: "⚠️ Clé API Groq non configurée. Ajoutez votre clé dans le fichier .env.local (GROQ_API_KEY=gsk_...)"
      });
    }

    const systemPrompt = SYSTEM_PROMPT.replace('{context}', JSON.stringify(context, null, 2));

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json({
        action: 'message',
        message: `Erreur API Groq: ${response.status}. Vérifiez votre clé API.`,
        response: `Erreur API Groq: ${response.status}. Vérifiez votre clé API.`
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    try {
      // Parse la réponse JSON de l'IA
      const parsed = JSON.parse(aiResponse);
      return NextResponse.json(parsed);
    } catch {
      // Si ce n'est pas du JSON valide, retourner comme message
      return NextResponse.json({
        action: 'message',
        message: aiResponse,
        response: aiResponse
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      action: 'message',
      message: "Désolé, une erreur s'est produite. Réessayez.",
      response: "Désolé, une erreur s'est produite. Réessayez."
    }, { status: 500 });
  }
}
