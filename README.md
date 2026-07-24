# RECOFIABLE 🧭

> Des recommandations adaptées à votre besoin, fondées sur des expériences fiables.

Plateforme web de recommandations locales (lancement initial : Maroc / Casablanca) : recherche en
langage naturel (français, arabe, darija), notes publiques calculées statistiquement (moyenne
bayésienne), niveaux de confiance, vérification des visites, anti-fraude, réseau de confiance,
espace professionnel et administration complète.

**Toutes les données de démonstration (lieux, avis, comptes, factures) sont fictives.**

> Ce dépôt contient aussi un ancien prototype sans rapport (`index.html`, BendiTV) conservé tel quel.

## Démarrage rapide

Prérequis : Node.js ≥ 20, Docker (ou un PostgreSQL 16 local).

```bash
# 1. Configuration
cp .env.example .env          # puis éditez SESSION_SECRET

# 2. Base de données
docker compose up -d db       # PostgreSQL 16 sur localhost:5432
#   (sans Docker : créez l'utilisateur/base "recofiable" et adaptez DATABASE_URL)

# 3. Installation + migrations + données de démonstration + client Prisma
npm run setup

# 4. Développement
npm run dev                   # http://localhost:3000
```

Commande par commande, `npm run setup` équivaut à :

```bash
npm install
npx prisma generate
npm run db:migrate            # prisma migrate deploy
npm run db:seed               # 65 lieux, ~440 expériences, comptes démo
```

## Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin@recofiable.demo` | `Admin123!` |
| Modérateur | `moderateur@recofiable.demo` | `Moderateur123!` |
| Utilisateur | `utilisateur@recofiable.demo` | `Utilisateur123!` |
| Professionnel (gratuit) | `pro-gratuit@recofiable.demo` | `Professionnel123!` |
| Professionnel (premium) | `pro-premium@recofiable.demo` | `Professionnel123!` |

Ils sont rappelés sur l'écran de connexion. Une vingtaine de contributeurs fictifs
(`…@exemple.demo` / `Demo123!`) alimentent le réseau, plus une vague d'avis frauduleuse de
démonstration sur la fiche « Promoteur Al Boughaz (fictif) ».

## Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict |
| `npm test` | Tests unitaires + intégration (Vitest — la base seedée doit tourner) |
| `npm run test:e2e` | Parcours Playwright (après `npm run build` ; si Chromium est déjà installé sur la machine : `PLAYWRIGHT_CHROMIUM_PATH=/chemin/vers/chromium`) |
| `npm run db:seed` | Recharge les données de démonstration (destructif) |
| `npm run db:reset` | Réinitialise la base (migrations + seed) |

## Architecture

- **Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind CSS 4**
- **PostgreSQL 16 + Prisma** — schéma complet dans `prisma/schema.prisma` (~65 modèles)
- Authentification maison sécurisée (sessions en base, cookie httpOnly, bcrypt, rate limiting)
- Validation **Zod** côté serveur sur toutes les actions

```
src/
├── app/                  # Pages (publiques, compte, pro, admin) + API routes
├── components/           # UI partagée (notes, cartes lieux, formulaires…)
├── config/app.ts         # Nom, slogan, couleurs, devise… centralisés
├── i18n/                 # Architecture fr/ar (darija gérée par la recherche)
├── lib/                  # prisma, normalisation de texte, rate limiting
└── server/
    ├── actions/          # Server Actions par domaine (auth, user, review, pro, admin…)
    ├── auth/             # Sessions et contrôle d'accès par rôle
    ├── integrations/     # Abstractions : paiement, IA, e-mails, lieux, social, stockage
    └── services/         # Moteurs : notation bayésienne, confiance, anti-fraude,
                          # classification NL, recherche/recommandation, notifications
```

### Principes clés implémentés

- **Note publique ≠ classement personnalisé** : la note /10 (bayésienne, pondérée par récence,
  vérification, fiabilité, anti-fraude) est identique pour tous ; le réseau et les préférences
  n'influencent que l'ordre et les explications (« Pourquoi ce résultat ? »).
- **Anti-fraude** : détection de vagues, textes dupliqués (similarité trigrammes), comptes
  jetables ; décisions graduées (poids réduit, neutralisation, modération) toujours journalisées ;
  bandeau public « activité inhabituelle » sur les fiches concernées.
- **Vérification des visites** : 4 niveaux (déclarée → cohérente → visite confirmée → transaction
  confirmée). Les preuves détaillées sont réduites à un indicateur ; aucune position précise
  conservée.
- **Indépendance commerciale** : aucun abonnement ne modifie les notes ; le sponsoring est
  toujours étiqueté « Sponsorisé ».

## Limites liées aux services externes (modes démo)

Tout fonctionne sans clé grâce aux abstractions de `src/server/integrations/` :

| Service | Mode par défaut | Activation réelle |
|---|---|---|
| E-mails | `MAIL_PROVIDER=console` — affichés dans la console serveur (validation d'e-mail simulée) | brancher SMTP via `SMTP_URL` |
| Paiement abonnements | `PAYMENT_PROVIDER=demo` — paiement fictif + factures « démo » ; aucune donnée bancaire stockée | `stripe` + `STRIPE_SECRET_KEY` (adaptateur à compléter) |
| IA / langage | `AI_PROVIDER=local` — règles + dictionnaires (fr/ar/darija), synthèses factuelles | API compatible via `AI_API_URL` + `AI_API_KEY` |
| Import de lieux | `PLACES_PROVIDER=demo` — données fictives ; **aucune aspiration de Google Maps ni copie d'avis d'autres plateformes** | API officielle sous licence à brancher |
| Connexion sociale | désactivée — le réseau est 100 % interne | `SOCIAL_LOGIN_ENABLED=true` + identifiants d'application |
| Carte | vue schématique SVG autonome | fournisseur de tuiles sous licence |
| Notifications mobiles | in-app + e-mail ; architecture PWA prête (manifest, service worker, page hors ligne) | service push |

Ne mettez jamais de clé secrète dans le code : uniquement dans `.env` (jamais commité).
