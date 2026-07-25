// Les tests d'intégration s'exécutent contre la base de démonstration
// locale (chargée par `npm run db:seed`).
process.env.DATABASE_URL ??= "postgresql://recofiable:recofiable@localhost:5432/recofiable";
process.env.SESSION_SECRET ??= "test-secret";
