# OrganizApp

Application complète de gestion de projets et tâches pour développeurs, avec une version web (Next.js/Vercel) et une application mobile (React Native/Expo).

## Fonctionnalités

- **Gestion de projets** : Créer, éditer, supprimer des projets avec couleurs et priorités
- **Tâches et sous-tâches** : Organiser le travail avec des tâches détaillées
- **Calendrier/Agenda** : Visualiser les échéances sous forme de calendrier
- **Veille technologique** : Sauvegarder articles, idées et liens utiles
- **Notifications** : Rappels et alertes d'échéances
- **Statistiques** : Suivi de l'avancement et rapports

## Structure du projet

```
OrganizApp/
├── web/          # Application web Next.js (Vercel)
└── mobile/       # Application mobile React Native (Expo)
```

## Application Web

### Installation

```bash
cd web
npm install
```

### Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### Build pour production

```bash
npm run build
npm start
```

### Déploiement sur Vercel

Le projet est configuré pour un déploiement automatique sur Vercel. Il suffit de connecter le repository GitHub à Vercel et de pointer vers le dossier `/web`.

## Application Mobile

### Prérequis

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Application Expo Go sur votre appareil mobile

### Installation

```bash
cd mobile
npm install
```

### Développement

```bash
npm start
# ou
expo start
```

Scannez le QR code avec l'application Expo Go pour tester sur votre appareil.

### Build pour production

Pour créer un build Android/iOS :

```bash
# Android
expo build:android

# iOS
expo build:ios
```

## Stockage des données

Les deux applications utilisent un stockage local :
- **Web** : localStorage du navigateur
- **Mobile** : AsyncStorage de React Native

Les données sont persistées localement et peuvent être exportées/importées depuis la page Paramètres.

## Technologies utilisées

### Web
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons
- date-fns

### Mobile
- React Native
- Expo 50
- TypeScript
- Expo Router
- AsyncStorage
- date-fns

## Pages/Écrans

1. **Dashboard** - Vue d'ensemble des projets et tâches
2. **Projets** - Liste et gestion des projets
3. **Détail projet** - Tâches et sous-tâches d'un projet
4. **Calendrier** - Vue calendrier des échéances
5. **Veille** - Articles, idées et ressources
6. **Notifications** - Rappels et alertes
7. **Paramètres** - Statistiques et gestion des données

## Licence

MIT
