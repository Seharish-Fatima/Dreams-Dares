// bucket-fire.js  (load after firebase-init.js)
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db, auth } from "./js/firebase-init.js";

// 1) Which list are we on?
const params = new URLSearchParams(location.search);
const listId = params.get("listId") || "shared"; // default to shared

// 2) Live query the items in /lists/{listId}/items
const itemsCol = collection(db, `lists/${listId}/items`);
const q = query(itemsCol, orderBy("createdAt", "desc"));
onSnapshot(q, (snap) => {
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderItems(items); // your existing render fn
});

// 3) Create
async function createItem(payload) {
  await addDoc(itemsCol, {
    title: payload.title || "Untitled",
    location: payload.location || "",
    dueDate: payload.dueDate || "",
    notes: payload.notes || "",
    status: payload.status || "todo",
    image: payload.image || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
  });
}

// 4) Update
async function updateItem(id, patch) {
  await updateDoc(doc(db, `lists/${listId}/items/${id}`), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

// 5) Delete
async function removeItem(id) {
  await deleteDoc(doc(db, `lists/${listId}/items/${id}`));
}

// expose to your UI handlers:
window.BucketAPI = { createItem, updateItem, removeItem };
