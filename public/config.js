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
  { id: "person-1", name: "Person 1" },
  { id: "person-2", name: "Person 2" },
  { id: "person-3", name: "Person 3" },
  { id: "person-4", name: "Person 4" },
];
