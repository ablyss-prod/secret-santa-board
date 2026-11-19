// Firebase web config. These values are public by design; access is
// controlled by firestore.rules, not by keeping these secret.
export const firebaseConfig = {
  apiKey: "AIzaSyCOVqISAJWRdOnIlLszd63YVfiKx3V_6pc",
  authDomain: "secret-santa-secrets.firebaseapp.com",
  projectId: "secret-santa-secrets",
  storageBucket: "secret-santa-secrets.firebasestorage.app",
  messagingSenderId: "523777969088",
  appId: "1:523777969088:web:143f4f705bcd442f7f5625",
};

// Everyone in the exchange. `id` is stored with each post, so don't change
// an id after people start posting (changing `name` is fine).
export const participants = [
  { id: "sophie", name: "Sophie" },
  { id: "hadley", name: "Hadley" },
  { id: "mandi", name: "Mandi" },
  { id: "anisha", name: "Anisha" },
  { id: "addie", name: "Addie" },
  { id: "hollie", name: "Hollie" },
  { id: "lucas", name: "Lucas" },
  { id: "abigail", name: "Abigail" },
  { id: "leyla", name: "Leyla" },
  { id: "mira", name: "Mira" },
];
