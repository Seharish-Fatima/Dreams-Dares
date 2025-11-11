// create-list.js
import { db, auth } from "./js/firebase-init.js";
import {
  doc,
  setDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const user = await new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (u) => {
    if (u) {
      unsub();
      resolve(u);
    }
  });
});

const listId = "shared";
await setDoc(
  doc(db, "lists", listId),
  { ownerUids: arrayUnion(user.uid), name: "Our Bucket List" },
  { merge: true }
);

console.log("✅ List ready:", listId);
