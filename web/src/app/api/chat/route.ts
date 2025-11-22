import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches pour développeurs.

Tu peux effectuer les actions suivantes. IMPORTANT: Tu dois TOUJOURS répondre avec UN SEUL objet JSON valide.

ACTIONS DISPONIBLES:

1. CRÉER UN ÉVÉNEMENT/RDV/RÉUNION (IMPORTANT - utilise TOUJOURS cette action pour les rendez-vous, réunions, événements planifiés):
{"action": "create_event", "data": {"title": "RDV Médecin", "date": "2024-01-15", "time": "14:00", "description": "Description", "location": "Lieu"}, "response": "J'ai ajouté votre RDV au planning !"}

IMPORTANT: Pour TOUT ce qui concerne un RDV, une réunion, un événement avec une date/heure, utilise TOUJOURS "create_event" et NON "create_notification".

2. CRÉER UN PROJET (avec ses tâches):
{"action": "create_project", "data": {"name": "Nom", "description": "Description", "priority": "high|medium|low", "tasks": ["Tâche 1", "Tâche 2"]}, "response": "Message"}

3. CRÉER PLUSIEURS TÂCHES (utilise "actions" au pluriel):
{"actions": [
  {"action": "create_task", "data": {"title": "Tâche 1", "projectName": "Projet", "priority": "high", "subtasks": ["Sous-tâche"]}},
  {"action": "create_task", "data": {"title": "Tâche 2", "projectName": "Projet", "priority": "medium"}}
], "response": "J'ai créé X tâches pour le projet !"}

4. CRÉER UNE SEULE TÂCHE:
{"action": "create_task", "data": {"title": "Titre", "description": "Description", "projectName": "Nom du projet", "priority": "high|medium|low", "dueDate": "2024-01-15", "subtasks": ["Sous-tâche 1"]}, "response": "Message"}

5. AUTRES ACTIONS:
- create_watch_item: {"action": "create_watch_item", "data": {"title": "Titre", "url": "https://...", "category": "Article|Tutoriel|Outil", "tags": ["tag1"]}, "response": "..."}
- create_notification: {"action": "create_notification", "data": {"title": "Titre", "message": "Message", "type": "reminder|deadline|info"}, "response": "..."} (UNIQUEMENT pour des rappels simples sans date précise)
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
- Pour les RDV, réunions, événements avec date → utilise TOUJOURS "create_event" (ils apparaîtront dans le calendrier/planning)
- Pour les rappels simples sans date → utilise "create_notification"
- Inclus TOUJOURS un champ "response" avec un message convivial en français
- Calcule les dates relatives: "demain" = date de demain, "lundi" = prochain lundi, etc.

DATE ACTUELLE: ${new Date().toISOString().split('T')[0]}

CONTEXTE ACTUEL:
{context}

EXEMPLES:
- "J'ai un RDV demain à 14h" → {"action": "create_event", "data": {"title": "RDV", "date": "DATE_DEMAIN", "time": "14:00"}, "response": "..."}
- "Réunion lundi à 10h" → {"action": "create_event", "data": {"title": "Réunion", "date": "DATE_LUNDI", "time": "10:00"}, "response": "..."}
- "Mets ça dans le planning" → {"action": "create_event", ...}`;

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
