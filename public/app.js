import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore, collection, collectionGroup, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig, participants } from "./config.js";

const db = getFirestore(initializeApp(firebaseConfig));
const ME_KEY = "santa-board-me";
const SEEN_KEY = "santa-board-seen";
const $ = (id) => document.getElementById(id);

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function getMe() {
  try {
    const id = localStorage.getItem(ME_KEY);
    return participants.find((p) => p.id === id) || null;
  } catch { return null; }
}
function setMe(id) {
  try { id ? localStorage.setItem(ME_KEY, id) : localStorage.removeItem(ME_KEY); } catch {}
}

function timeAgo(ts) {
  if (!ts) return "just now";
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ---- Unread counts ----------------------------------------------------
// lastSeen[personId] = newest post/reply time (ms) seen on that board.
let lastSeen = {};
try { lastSeen = JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch {}
const saveSeen = () => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(lastSeen)); } catch {} };

const postAbout = new Map(); // postId -> personId
let postItems = [];          // [{ about, ms }]
let replyItems = [];         // [{ postId, ms }]
let currentId = null;
let globalUnsubs = [];

const msOf = (d) => d.createdAt?.toMillis() ?? 0; // pending writes count as seen

function activity(personId) {
  return [
    ...postItems.filter((p) => p.about === personId).map((p) => p.ms),
    ...replyItems.filter((r) => postAbout.get(r.postId) === personId).map((r) => r.ms),
  ];
}

function updateBadges() {
  if (currentId) {
    const newest = Math.max(0, ...activity(currentId));
    if (newest > (lastSeen[currentId] || 0)) { lastSeen[currentId] = newest; saveSeen(); }
  }
  for (const btn of $("people").children) {
    const id = btn.dataset.id;
    const n = id === currentId ? 0 : activity(id).filter((ms) => ms > (lastSeen[id] || 0)).length;
    const badge = btn.querySelector(".badge");
    badge.textContent = n > 99 ? "99+" : String(n);
    badge.hidden = n === 0;
    btn.setAttribute("aria-label", n ? `${btn.dataset.name}, ${n} new` : btn.dataset.name);
  }
}

function watchActivity() {
  globalUnsubs.forEach((u) => u());
  globalUnsubs = [
    onSnapshot(collection(db, "posts"), (snap) => {
      postAbout.clear();
      postItems = snap.docs.map((d) => {
        postAbout.set(d.id, d.data().about);
        return { about: d.data().about, ms: msOf(d.data()) };
      });
      updateBadges();
    }, console.error),
    onSnapshot(collectionGroup(db, "replies"), (snap) => {
      replyItems = snap.docs.map((d) => ({ postId: d.ref.parent.parent.id, ms: msOf(d.data()) }));
      updateBadges();
    }, console.error),
  ];
}

let unsubs = [];
function clearSubs() { unsubs.forEach((u) => u()); unsubs = []; }

function showPicker() {
  clearSubs();
  globalUnsubs.forEach((u) => u()); globalUnsubs = [];
  currentId = null;
  $("board").hidden = true;
  $("whoami").hidden = true;
  $("picker").hidden = false;
  const list = $("picker-list");
  list.replaceChildren(...participants.map((p) =>
    el("button", { onclick: () => {
      if (confirm(`You're ${p.name}? Your own board will be hidden.`)) { setMe(p.id); start(); }
    } }, p.name)));
}

function start() {
  const me = getMe();
  if (!me) return showPicker();
  $("picker").hidden = true;
  $("whoami").hidden = false;
  $("me-name").textContent = me.name;
  $("board").hidden = false;

  const others = participants.filter((p) => p.id !== me.id);
  const nav = $("people");
  const select = (p) => {
    [...nav.children].forEach((b) => b.setAttribute("aria-current", String(b.dataset.id === p.id)));
    currentId = p.id;
    showPerson(p);
    updateBadges();
  };
  nav.replaceChildren(...others.map((p) => {
    const b = el("button", { onclick: () => select(p) }, p.name, el("span", { class: "badge", hidden: "" }));
    b.dataset.id = p.id;
    b.dataset.name = p.name;
    return b;
  }));
  watchActivity();
  if (others.length) select(others[0]);
}

function showPerson(person) {
  clearSubs();
  const view = $("person-view");
  let kind = "question";

  const qBtn = el("button", { type: "button", "aria-pressed": "true" }, "❓ Ask a question");
  const iBtn = el("button", { type: "button", "aria-pressed": "false" }, "💡 Share an idea");
  const setKind = (k) => {
    kind = k;
    qBtn.setAttribute("aria-pressed", String(k === "question"));
    iBtn.setAttribute("aria-pressed", String(k === "idea"));
    text.placeholder = k === "question"
      ? `Ask about ${person.name}'s taste, e.g. "Do they like dark or milk chocolate?"`
      : `Gift idea for ${person.name}, e.g. "They mentioned wanting a new scarf"`;
  };
  qBtn.addEventListener("click", () => setKind("question"));
  iBtn.addEventListener("click", () => setKind("idea"));

  const text = el("textarea", { maxlength: "1000" });
  const err = el("div", { class: "error" });
  const postBtn = el("button", { class: "primary", type: "submit" }, "Post anonymously");
  const form = el("form", { class: "compose card" },
    el("h2", {}, `${person.name}'s board`),
    el("div", { class: "kind" }, qBtn, iBtn), text, err, el("div", {}, postBtn));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = text.value.trim();
    if (!value) return;
    postBtn.disabled = true; err.textContent = "";
    try {
      await addDoc(collection(db, "posts"), { about: person.id, kind, text: value, createdAt: serverTimestamp() });
      text.value = "";
    } catch (ex) {
      err.textContent = "Couldn't post. Try again.";
      console.error(ex);
    } finally { postBtn.disabled = false; }
  });
  setKind("question");

  const postsEl = el("div", { class: "posts" }, el("p", { class: "muted" }, "Loading…"));
  view.replaceChildren(form, postsEl);

  // Equality-only query (no composite index needed); sort on the client.
  const q = query(collection(db, "posts"), where("about", "==", person.id));
  unsubs.push(onSnapshot(q, (snap) => {
    const docs = snap.docs.sort((a, b) =>
      (b.data().createdAt?.toMillis() ?? Infinity) - (a.data().createdAt?.toMillis() ?? Infinity));
    if (!docs.length) {
      postsEl.replaceChildren(el("p", { class: "muted" }, `Nothing yet. Be the first to ask about ${person.name}!`));
      return;
    }
    postsEl.replaceChildren(...docs.map(renderPost));
  }, (ex) => {
    postsEl.replaceChildren(el("p", { class: "error" }, "Couldn't load posts."));
    console.error(ex);
  }));
}

const replyCache = new Map();
function renderPost(docSnap) {
  const d = docSnap.data();
  const repliesEl = el("div", { class: "replies" });
  const input = el("input", { placeholder: "Reply anonymously…", maxlength: "500" });
  const form = el("form", { class: "reply-form" }, input, el("button", { type: "submit" }, "Reply"));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    try {
      await addDoc(collection(db, "posts", docSnap.id, "replies"), { text: value, createdAt: serverTimestamp() });
    } catch (ex) { input.value = value; console.error(ex); }
  });

  const drawReplies = (list) => repliesEl.replaceChildren(
    ...list.map((r) => el("div", { class: "reply" }, r.text)), form);
  drawReplies(replyCache.get(docSnap.id) || []);

  const rq = query(collection(db, "posts", docSnap.id, "replies"), orderBy("createdAt"));
  unsubs.push(onSnapshot(rq, (snap) => {
    const list = snap.docs.map((r) => r.data());
    replyCache.set(docSnap.id, list);
    drawReplies(list);
  }));

  return el("article", { class: "post card" },
    el("span", { class: `tag ${d.kind}` }, d.kind === "idea" ? "Idea" : "Question"),
    el("p", { class: "text" }, d.text),
    el("div", { class: "time muted" }, timeAgo(d.createdAt)),
    repliesEl);
}

$("switch").addEventListener("click", () => { setMe(null); showPicker(); });
start();
