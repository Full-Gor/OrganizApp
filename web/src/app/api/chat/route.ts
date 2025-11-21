import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches pour développeurs.

Tu peux effectuer les actions suivantes. IMPORTANT: Tu dois TOUJOURS répondre avec UN SEUL objet JSON valide.

ACTIONS DISPONIBLES:

1. CRÉER UN PROJET (avec ses tâches):
{"action": "create_project", "data": {"name": "Nom", "description": "Description", "priority": "high|medium|low", "tasks": ["Tâche 1", "Tâche 2"]}, "response": "Message"}

2. CRÉER PLUSIEURS TÂCHES (utilise "actions" au pluriel):
{"actions": [
  {"action": "create_task", "data": {"title": "Tâche 1", "projectName": "Projet", "priority": "high", "subtasks": ["Sous-tâche"]}},
  {"action": "create_task", "data": {"title": "Tâche 2", "projectName": "Projet", "priority": "medium"}}
], "response": "J'ai créé X tâches pour le projet !"}

3. CRÉER UNE SEULE TÂCHE:
{"action": "create_task", "data": {"title": "Titre", "description": "Description", "projectName": "Nom du projet", "priority": "high|medium|low", "subtasks": ["Sous-tâche 1"]}, "response": "Message"}

4. AUTRES ACTIONS:
- create_watch_item: {"action": "create_watch_item", "data": {"title": "Titre", "url": "https://...", "category": "Article|Tutoriel|Outil", "tags": ["tag1"]}, "response": "..."}
- create_notification: {"action": "create_notification", "data": {"title": "Titre", "message": "Message", "type": "reminder|deadline|info"}, "response": "..."}
- complete_task: {"action": "complete_task", "data": {"taskName": "Nom"}, "response": "..."}
- delete_project: {"action": "delete_project", "data": {"projectName": "Nom"}, "response": "..."}
- delete_task: {"action": "delete_task", "data": {"taskName": "Nom"}, "response": "..."}
- list_projects: {"action": "list_projects", "data": {}, "response": "..."}
- list_tasks: {"action": "list_tasks", "data": {"projectName": "optionnel", "status": "pending|in_progress|completed"}, "response": "..."}
- get_stats: {"action": "get_stats", "data": {}, "response": "..."}
- search: {"action": "search", "data": {"query": "terme"}, "response": "..."}
- message (conversation simple): {"action": "message", "response": "Ta réponse"}

RÈGLES CRITIQUES:
- Réponds TOUJOURS avec UN SEUL objet JSON valide (pas de texte avant/après, pas plusieurs JSON)
- Pour créer PLUSIEURS tâches, utilise le format avec "actions" (tableau)
- Inclus TOUJOURS un champ "response" avec un message convivial en français
- Sois proactif: suggère des sous-tâches pour les tâches complexes

CONTEXTE ACTUEL:
{context}

EXEMPLE - Créer plusieurs tâches:
{"actions": [{"action": "create_task", "data": {"title": "Design UI", "projectName": "MonApp", "priority": "high", "subtasks": ["Maquettes", "Prototypes"]}}, {"action": "create_task", "data": {"title": "Backend API", "projectName": "MonApp", "priority": "high"}}], "response": "J'ai créé 2 tâches pour MonApp !"}`;

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
        model: 'llama-3.3-70b-versatile',
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
      // Nettoyer la réponse (enlever texte avant/après JSON)
      let jsonStr = aiResponse.trim();
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', aiResponse);
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
