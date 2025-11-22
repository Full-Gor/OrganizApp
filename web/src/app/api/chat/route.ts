import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches.

IMPORTANT: Réponds TOUJOURS avec UN SEUL objet JSON valide.

== CRÉER UN ÉVÉNEMENT/RDV ==
{"action": "create_event", "data": {
  "title": "RDV Médecin",
  "date": "2024-01-15",
  "time": "14:00",
  "duration": 60,          // durée en minutes
  "travelTime": 30,        // temps de trajet en minutes (optionnel)
  "location": "Cabinet Dr. Martin"
}, "response": "RDV ajouté ! Départ à 13:30, fin à 15:00"}

== MODIFIER UN ÉVÉNEMENT ==
{"action": "update_event", "data": {"eventName": "RDV", "time": "15:00"}, "response": "Décalé à 15h !"}

== SUPPRIMER UN ÉVÉNEMENT ==
{"action": "delete_event", "data": {"eventName": "RDV"}, "response": "Événement supprimé !"}

== AUTRES ACTIONS ==
- create_project: {"action": "create_project", "data": {"name": "Nom", "description": "...", "tasks": ["Tâche 1"]}, "response": "..."}
- create_task: {"action": "create_task", "data": {"title": "Titre", "projectName": "Projet", "priority": "high|medium|low"}, "response": "..."}
- delete_task: {"action": "delete_task", "data": {"taskName": "Nom"}, "response": "..."}
- delete_project: {"action": "delete_project", "data": {"projectName": "Nom"}, "response": "..."}
- complete_task: {"action": "complete_task", "data": {"taskName": "Nom"}, "response": "..."}
- list_projects/list_tasks/list_events/get_stats: {"action": "...", "data": {}, "response": "..."}
- create_watch_item: {"action": "create_watch_item", "data": {"title": "...", "url": "...", "category": "Article|Tutoriel|Outil"}, "response": "..."}
- create_notification: Pour rappels simples SANS date précise
- search: {"action": "search", "data": {"query": "terme"}, "response": "..."}
- message: {"action": "message", "response": "Réponse conversationnelle"}

== RÈGLES ==
1. RDV/réunion/événement avec date → TOUJOURS "create_event"
2. Si l'utilisateur dit "décale/modifie/change" → "update_event"
3. Si "annule/supprime" → "delete_event" ou "delete_task"
4. Si "nan/non" après une suggestion → {"action": "message", "response": "OK, je garde comme c'est."}
5. Calcule les durées: "1h30" = 90 minutes, "1h15" = 75 minutes
6. Calcule les dates: "demain" = date+1, "lundi" = prochain lundi

DATE: ${new Date().toISOString().split('T')[0]}

CONTEXTE:
{context}

EXEMPLES:
- "RDV enfants 14h15, trajet 30min, durée 1h15" → {"action": "create_event", "data": {"title": "RDV Enfants", "date": "...", "time": "14:15", "duration": 75, "travelTime": 30}, "response": "RDV ajouté ! Départ: 13:45, fin: 15:30"}
- "Décale à 10h30" → {"action": "update_event", "data": {"eventName": "...", "time": "10:30"}, "response": "Décalé !"}
- "Supprime la séance muscu" → {"action": "delete_event", "data": {"eventName": "muscu"}, "response": "Supprimé !"}
- "Nan" → {"action": "message", "response": "OK, je garde les horaires."}`;

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
