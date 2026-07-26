RECOFIABLE — MAQUETTE UX INTERACTIVE
=====================================

Ceci est une maquette de validation UX/UI. Aucun backend, aucune base de
données, aucune authentification réelle, aucun paiement. Toutes les
données (lieux, avis, questions, profils) sont fictives et vivent en
mémoire / localStorage dans le navigateur.

LANCER LA MAQUETTE
-------------------
Option 1 (le plus simple) : double-cliquez sur index.html, il s'ouvre
directement dans votre navigateur.

Option 2 (recommandée pour un rendu identique en tout point) :
  npx serve .
ou
  python3 -m http.server 8080
puis ouvrez http://localhost:8080

FICHIERS
--------
index.html   Structure de la page (coquille + navigation)
styles.css   Tous les styles (mobile-first)
data.js      Données fictives : lieux, questions, sujets, profils, réseau
app.js       Logique : routage, rendu des vues, interactions simulées
assets/      Visuels locaux (SVG) — aucune image externe requise

NAVIGUER DANS LA MAQUETTE
--------------------------
- Barre de navigation basse (mobile) / haute (ordinateur) : Accueil,
  Rechercher, Contribuer, Enregistrés, Compte.
- La recherche accepte du texte libre (voir les suggestions sur l'accueil).
- Basculez Liste / Carte sur la page de résultats (côte à côte sur
  ordinateur).
- Le bouton "Pour vous" (menu Compte ou page dédiée) permet de changer
  de profil de démonstration pour observer la personnalisation.
- Le bouton flottant "Une remarque ?" envoie un retour visible ensuite
  dans Compte > Mini-administration des retours (mode pilote).

Toutes les interactions listées dans le cahier des charges sont
fonctionnelles côté navigateur : recherche, filtres, carte, fiches,
parcours de contribution express + détaillé, questions, sujets vivants,
personnalisation, favoris/collections, feedback.
