// firebase-bucket.js — syncs bucket list to Firestore
import { db } from "../firebase-init.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const bucketRef = collection(db, "bucketList");

export async function addBucketItem(item) {
  return await addDoc(bucketRef, item);
}

export async function getBucketItems(callback) {
  onSnapshot(bucketRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

export async function updateBucketItem(id, updates) {
  const ref = doc(db, "bucketList", id);
  await updateDoc(ref, updates);
}

export async function deleteBucketItem(id) {
  const ref = doc(db, "bucketList", id);
  await deleteDoc(ref);
}
