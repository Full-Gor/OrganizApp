import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es l'assistant IA d'OrganizApp, une application de gestion de projets et tâches.

IMPORTANT: Réponds TOUJOURS avec UN SEUL objet JSON valide.

== PLANIFIER PLUSIEURS RDV (PRIORITAIRE si 2+ événements) ==
{"action": "plan_day", "data": {
  "date": "2024-01-15",
  "events": [
    {"title": "RDV Médecin", "time": "09:30", "duration": 45, "travelTime": 20},
    {"title": "RDV Dentiste", "time": "14:00", "duration": 30, "travelTime": 15},
    {"title": "Sport", "time": "18:00", "duration": 90, "travelTime": 10}
  ]
}, "response": "📅 Planning:\n🚗 09:10 → 09:30-10:15 : Médecin\n🚗 13:45 → 14:00-14:30 : Dentiste\n🚗 17:50 → 18:00-19:30 : Sport\n✅ Pas de conflit !"}

== CRÉER UN SEUL ÉVÉNEMENT ==
{"action": "create_event", "data": {
  "title": "RDV Médecin",
  "date": "2024-01-15",
  "time": "14:00",
  "duration": 60,
  "travelTime": 30,
  "location": "Cabinet Dr. Martin"
}, "response": "RDV ajouté ! Départ à 13:30, fin à 15:00"}

== MODIFIER/SUPPRIMER ==
- update_event: {"action": "update_event", "data": {"eventName": "RDV", "time": "15:00"}, "response": "Décalé !"}
- delete_event: {"action": "delete_event", "data": {"eventName": "RDV"}, "response": "Supprimé !"}

== CREER DES RUSH ==
UN Rush = gestion multi-projets avec workflow (etapes). Utilise pour travailler sur plusieurs projets en parallele.

- create_rush (1 seul Rush):
{"action": "create_rush", "data": {
  "name": "Sprint Apps Semaine 47",
  "projectNames": ["App Client A", "App Client B", "App Client C"]
}, "response": "Rush cree avec 3 projets !"}

- create_multiple_rushes (PLUSIEURS Rush):
{"action": "create_multiple_rushes", "data": {
  "rushes": [
    {"name": "Rush 1", "projectNames": ["Projet 1"]},
    {"name": "Rush 2", "projectNames": ["Projet 2"]},
    {"name": "Rush 3", "projectNames": ["Projet 3"]}
  ]
}, "response": "3 Rush crees !"}

- Avec workflow personnalise:
{"action": "create_rush", "data": {
  "name": "Mon Rush",
  "projectNames": ["Projet A", "Projet B"],
  "workflow": [
    {"title": "Analyse", "timeLimit": 10},
    {"title": "Dev", "timeLimit": 30},
    {"title": "Test", "timeLimit": 15}
  ]
}, "response": "Rush cree avec workflow personnalise !"}

- list_rushes, delete_rush

== AUTRES ACTIONS ==
- create_project, create_task, delete_task, delete_project, complete_task
- list_projects, list_tasks, list_events, get_stats
- create_watch_item, search, message

== RÈGLES IMPORTANTES ==
1. PLUSIEURS RDV dans le même message → TOUJOURS "plan_day" avec tableau events
2. UN SEUL RDV → "create_event"
3. Calcul durées: "1h30" = 90min, "1h15" = 75min, "45min" = 45
4. Temps trajet: "trajet 20min" → travelTime: 20
5. Détection conflit: si fin_evt1 > départ_evt2 → conflit
6. "décale/modifie" → update_event
7. "nan/non" → {"action": "message", "response": "OK"}

DATE: ${new Date().toISOString().split('T')[0]}

CONTEXTE:
{context}

EXEMPLES:
- "RDV médecin 9h30 trajet 20min durée 45min, puis dentiste 14h trajet 15min durée 30min"
  → {"action": "plan_day", "data": {"date": "...", "events": [{"title": "RDV Médecin", "time": "09:30", "duration": 45, "travelTime": 20}, {"title": "RDV Dentiste", "time": "14:00", "duration": 30, "travelTime": 15}]}, "response": "📅 Planning OK !"}

- "RDV coiffeur 14h durée 1h, puis banque 14h30 trajet 10min" (CONFLIT!)
  → {"action": "plan_day", "data": {"date": "...", "events": [{"title": "Coiffeur", "time": "14:00", "duration": 60, "travelTime": 0}, {"title": "Banque", "time": "14:30", "duration": 30, "travelTime": 10}]}, "response": "⚠️ CONFLIT: Coiffeur finit à 15:00 mais Banque départ 14:20!"}

- "RDV enfants 14h15 trajet 30min durée 1h15" (UN SEUL)
  → {"action": "create_event", "data": {"title": "RDV Enfants", "time": "14:15", "duration": 75, "travelTime": 30}, "response": "Départ 13:45, fin 15:30"}`;

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
