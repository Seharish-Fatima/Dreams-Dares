// js/adapters/firebase-bucket.js
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
import { db, auth } from "../firebase-init.js";

const params = new URLSearchParams(location.search);
const listId = params.get("listId") || "shared";

const itemsCol = collection(db, `lists/${listId}/items`);
const q = query(itemsCol, orderBy("createdAt", "desc"));

onSnapshot(q, (snap) => {
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (window.renderBucketItems) window.renderBucketItems(items);
});

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

async function updateItem(id, patch) {
  await updateDoc(doc(db, `lists/${listId}/items/${id}`), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

async function removeItem(id) {
  await deleteDoc(doc(db, `lists/${listId}/items/${id}`));
}

window.BucketAPI = { createItem, updateItem, removeItem };
