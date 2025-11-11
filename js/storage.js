// storage.js — shared localStorage state for Dreams & Dares
export const LS_KEY = "dd_state_v1";

/* -------- core state -------- */
export function getState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : seed();
  } catch {
    return seed();
  }
}
export function saveState(s) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}
export function uid() {
  return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* -------- Bucket List API -------- */
export function addBucketItem({
  title,
  location = "",
  dueDate = "",
  notes = "",
  status = "todo",
  image = null,
}) {
  const s = getState();
  s.bucketList = s.bucketList || [];
  s.bucketList.push({
    id: uid(),
    createdAt: Date.now(),
    title,
    location,
    dueDate,
    notes,
    status, // "todo" | "done"
    image, // dataURL or null
    archived: false,
    doneAt: status === "done" ? Date.now() : null,
  });
  saveState(s);
  return s;
}

export function updateBucketItem(id, patch) {
  const s = getState();
  const it = (s.bucketList || []).find((x) => x.id === id);
  if (!it) return s;
  Object.assign(it, patch);
  if (patch.status === "done" && !it.doneAt) it.doneAt = Date.now();
  if (patch.status === "todo") it.doneAt = null;
  saveState(s);
  return s;
}

export function archiveBucketItem(id) {
  const s = getState();
  const it = (s.bucketList || []).find((x) => x.id === id);
  if (it) {
    it.archived = true;
    saveState(s);
  }
  return s;
}

/* -------- seed (minimal for bucket page) -------- */
function seed() {
  const now = Date.now();
  const demoImg =
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#210635"/><stop offset="70%" stop-color="#420d4b"/><stop offset="100%" stop-color="#7b337e"/>
        </linearGradient></defs>
        <rect width="600" height="400" fill="url(#g)"/>
        <text x="50%" y="52%" text-anchor="middle" fill="#f5d5e0" font-family="Inter, sans-serif" font-size="26">Dreams & Dares</text>
      </svg>`
    );

  const s = {
    bucketList: [
      {
        id: uid(),
        createdAt: now - 86400000 * 4,
        title: "Sunrise hike at Hawksbay",
        location: "Karachi",
        dueDate: "",
        notes: "Pack coffee & camera",
        status: "todo",
        image: demoImg,
        archived: false,
        doneAt: null,
      },
      {
        id: uid(),
        createdAt: now - 86400000 * 2,
        title: "Host a themed movie night",
        location: "Home",
        dueDate: "",
        notes: "Dress code: purple.",
        status: "done",
        image: demoImg,
        archived: false,
        doneAt: now - 86400000,
      },
    ],
  };
  saveState(s);
  return s;
}
