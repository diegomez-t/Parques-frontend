# Parqués Frontend

Frontend pour le jeu de société Parqués Colombien. Construit avec Next.js 16, React 19, TypeScript, Tailwind CSS 4 et Socket.IO.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js >= 20.0.0
- Yarn 4+ (Berry)

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd parques-frontend

# Installer les dépendances
yarn install

# Copier le fichier d'environnement
cp env.example .env.local
```

### Configuration

Modifier le fichier `.env.local` :

```env
# API Backend (le backend tourne sur le port 3000 par défaut)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Application Frontend (le frontend tourne sur le port 3001)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

> ⚠️ **Important** : Assurez-vous que le backend (`parques-backend`) tourne sur le port 3000 avant de lancer le frontend.

### Lancement

```bash
# Mode développement (port 3001)
yarn dev

# Build production
yarn build

# Démarrer en production
yarn start

# Linting
yarn lint
```

## 📁 Structure du Projet

```
parques-frontend/
├── messages/               # Traductions i18n
│   ├── en.json             # Anglais
│   ├── es.json             # Espagnol
│   └── fr.json             # Français
├── public/                 # Assets statiques
├── src/
│   ├── app/
│   │   ├── [locale]/       # Pages avec i18n
│   │   │   ├── layout.tsx  # Layout principal
│   │   │   ├── page.tsx    # Page d'accueil
│   │   │   └── not-found.tsx
│   │   └── globals.css     # Styles globaux + Tailwind
│   ├── components/
│   │   ├── Chat.tsx        # Composant de chat
│   │   └── PlayerList.tsx  # Liste des joueurs
│   ├── hooks/
│   │   └── useSocket.ts    # Hook Socket.IO
│   ├── i18n/
│   │   ├── navigation.ts   # Navigation i18n
│   │   ├── request.ts      # Requêtes i18n
│   │   └── routing.ts      # Configuration routing
│   ├── lib/
│   │   ├── socket.ts       # Client Socket.IO
│   │   └── utils.ts        # Utilitaires (cn, etc.)
│   ├── store/
│   │   └── gameStore.ts    # État Zustand
│   └── middleware.ts       # Middleware Next.js (i18n)
├── env.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

## 🎮 Fonctionnalités

### 🌐 Internationalisation (i18n)

Le frontend supporte 3 langues via `next-intl` :
- 🇪🇸 Espagnol (par défaut)
- 🇬🇧 Anglais
- 🇫🇷 Français

Les traductions sont dans le dossier `messages/`.

### 🔌 Socket.IO

Communication temps réel avec le backend pour :
- Création/rejoindre des salles
- Synchronisation de l'état du jeu
- Chat en temps réel
- Actions de jeu (lancer dés, déplacer pions)

### 📦 State Management

Zustand pour la gestion d'état globale :
- État de connexion socket
- Joueurs dans la salle
- État du jeu en cours
- Messages du chat

## 🛠️ Technologies

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16 | Framework React |
| React | 19 | UI Library |
| TypeScript | 5 | Typage statique |
| Tailwind CSS | 4 | Styles |
| Socket.IO Client | 4.7 | Temps réel |
| Zustand | 4.5 | State management |
| next-intl | 4.6 | Internationalisation |
| Motion | 12 | Animations |
| Radix UI | - | Composants accessibles |
| React Hook Form | 7.60 | Formulaires |
| Zod | 4.0 | Validation |
| Sonner | 2.0 | Notifications toast |

## 🎨 Design System

### Couleurs des Joueurs

| Couleur | Classe Tailwind |
|---------|-----------------|
| Rouge | `text-red-500` / `bg-red-500` |
| Bleu | `text-blue-500` / `bg-blue-500` |
| Vert | `text-green-500` / `bg-green-500` |
| Jaune | `text-yellow-500` / `bg-yellow-500` |
| Violet | `text-purple-500` / `bg-purple-500` |
| Orange | `text-orange-500` / `bg-orange-500` |

### Composants Disponibles

| Composant | Description |
|-----------|-------------|
| `Card` | Conteneur avec fond sombre et bordure |
| `Button` | Boutons primaires/secondaires avec variants |
| `Input` | Champs de saisie stylisés |
| `Chat` | Chat en temps réel avec scroll auto |
| `PlayerList` | Liste des joueurs avec statut ready |
| `Dialog` | Modales accessibles (Radix) |
| `Select` | Dropdowns accessibles (Radix) |

## 🔗 Hooks Personnalisés

### `useSocket`

Hook principal pour la connexion Socket.IO :

```tsx
import { useSocket } from "@/hooks/useSocket";

const socket = useSocket();

// Émettre un événement
socket.emit("room:create", { name: "Ma Partie" });

// Écouter un événement
socket.on("game:state", (state) => {
  console.log(state);
});
```

### Hooks de jeu (via store Zustand)

```tsx
import { useGameStore } from "@/store/gameStore";

const {
  isConnected,
  players,
  gameState,
  messages,
  // Actions
  setReady,
  sendMessage,
} = useGameStore();
```

## 📝 Scripts

```bash
yarn dev       # Développement sur port 3001
yarn build     # Build de production
yarn start     # Démarrer build de production
yarn lint      # Vérification ESLint
```

## 🔧 Configuration

### next.config.ts

Le projet utilise :
- App Router de Next.js
- Optimisation des images
- Plugin next-intl pour l'i18n

### Tailwind CSS v4

Tailwind v4 utilise une configuration CSS native dans `globals.css` au lieu d'un fichier `tailwind.config.js`.

## 📝 Licence

MIT
