// js/bucket.js — hybrid: Firestore (if present) + local fallback
import {
  getState,
  addBucketItem,
  updateBucketItem,
  archiveBucketItem,
} from "./storage.js";
import { filesToDataUrls, formatDate, openModal, closeModal } from "./utils.js";

(function () {
  const grid = document.getElementById("bucketGrid");
  const modal = document.getElementById("bucketModal");
  const form = document.getElementById("bucketForm");
  const addBtn = document.getElementById("addEntryBtn");
  const modalTitle = document.getElementById("modalTitle");

  if (!grid || !modal || !form) {
    console.warn("[Bucket] Required DOM nodes missing.");
    return;
  }

  // --------- State source ---------
  // If Firestore adapter is loaded it will push live arrays into this.
  let liveItems = null;

  // The adapter will call this whenever onSnapshot changes.
  window.renderBucketItems = (items) => {
    liveItems = Array.isArray(items) ? items : [];
    renderFromArray(liveItems);
  };

  // --------- UI events ---------
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      form.reset();
      ensureHiddenId(form);
      form.id.value = "";
      if (form.status) form.status.value = "todo";
      if (modalTitle) modalTitle.textContent = "New Bucket Item";
      openModal(modal);
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
  modal
    .querySelectorAll("[data-close-modal]")
    .forEach((b) => b.addEventListener("click", () => closeModal(modal)));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const fileInput = form.querySelector('input[name="media"]');
    const files = fileInput ? fileInput.files : [];
    const imgs = await filesToDataUrls(files);
    const image = imgs[0] || null;

    const payload = {
      title: (fd.get("title") || "").toString().trim(),
      location: (fd.get("location") || "").toString().trim(),
      dueDate: (fd.get("dueDate") || "").toString(),
      notes: (fd.get("notes") || "").toString().trim(),
      status: (fd.get("status") || "todo").toString(),
      image,
    };

    const id = (fd.get("id") || "").toString();

    // If Firestore adapter is present, use it; else localStorage.
    if (window.BucketAPI) {
      try {
        if (id) {
          await window.BucketAPI.updateItem(id, payload);
        } else {
          await window.BucketAPI.createItem(payload);
        }
      } catch (err) {
        console.error("[Bucket] Firestore write failed, falling back:", err);
      }
    } else {
      if (id) updateBucketItem(id, payload);
      else addBucketItem(payload);
      renderLocal(); // immediate local re-render
    }

    closeModal(modal);
  });

  // --------- Rendering ---------
  function render() {
    // Prefer live Firestore items if present; otherwise local.
    if (liveItems) {
      renderFromArray(liveItems);
    } else {
      renderLocal();
    }
  }

  function renderLocal() {
    const s = getState();
    const items = (s.bucketList || [])
      .filter((i) => !i.archived)
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderFromArray(items);
  }

  function renderFromArray(items) {
    if (!items || !items.length) {
      grid.innerHTML = `
        <div class="center dd-fade-in" style="min-height:220px">
          <div style="text-align:center">
            <div style="font-size:42px;opacity:.9">🌙</div>
            <p class="dd-card-meta" style="margin:8px 0 0">Add your first dare ✨</p>
          </div>
        </div>`;
      return;
    }
    grid.innerHTML = "";
    items.forEach((it) => grid.appendChild(card(it)));
  }

  function card(it) {
    const el = document.createElement("article");
    el.className = "bucket-card dd-fade-in";

    const img = document.createElement("img");
    img.className = "bucket-img";
    img.alt = it.title || "cover";
    img.src =
      it.image ||
      "data:image/svg+xml;base64," +
        btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="rgba(255,255,255,0.04)"/><text x="50%" y="52%" text-anchor="middle" fill="#f5d5e0" font-family="Inter, sans-serif" font-size="16">No Image</text></svg>`
        );

    const body = document.createElement("div");

    const h = document.createElement("h3");
    h.className = "bucket-title";
    h.textContent = it.title || "Untitled";

    const meta = document.createElement("p");
    meta.className = "bucket-meta";
    const bits = [
      it.createdAt ? `created ${formatDate(it.createdAt)}` : null,
      it.location ? it.location : null,
      it.dueDate ? `due ${it.dueDate}` : null,
    ].filter(Boolean);
    meta.textContent = bits.join(" · ");

    // Status dropdown
    const statusSel = document.createElement("select");
    statusSel.className = "bucket-status";
    statusSel.innerHTML = `
      <option value="todo">To-Do</option>
      <option value="done">Done</option>
    `;
    statusSel.value = it.status === "done" ? "done" : "todo";
    statusSel.addEventListener("change", async () => {
      if (window.BucketAPI) {
        await window.BucketAPI.updateItem(it.id, { status: statusSel.value });
      } else {
        updateBucketItem(it.id, { status: statusSel.value });
        renderLocal();
      }
    });

    const notes = document.createElement("p");
    notes.className = "bucket-notes";
    notes.textContent = it.notes || "";

    const controls = document.createElement("div");
    controls.className = "bucket-controls";

    const editBtn = document.createElement("button");
    editBtn.className = "dd-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openEdit(it));

    const delBtn = document.createElement("button");
    delBtn.className = "dd-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Archive this item?")) return;
      if (window.BucketAPI) {
        await window.BucketAPI.removeItem(it.id);
      } else {
        archiveBucketItem(it.id);
        renderLocal();
      }
    });

    controls.append(statusSel, editBtn, delBtn);

    body.append(h, meta);
    if (it.notes) body.appendChild(notes);
    body.appendChild(controls);

    el.append(img, body);
    return el;
  }

  function openEdit(it) {
    form.reset();
    ensureHiddenId(form);
    if (modalTitle) modalTitle.textContent = "Edit Bucket Item";

    form.id.value = it.id || "";
    form.title.value = it.title || "";
    form.location.value = it.location || "";
    form.dueDate.value = it.dueDate || "";
    if (form.status) form.status.value = it.status || "todo";
    form.notes.value = it.notes || "";
    openModal(modal);
  }

  function ensureHiddenId(formEl) {
    if (!formEl.id) {
      const hid = document.createElement("input");
      hid.type = "hidden";
      hid.name = "id";
      formEl.appendChild(hid);
    }
  }

  // initial render (local fallback). If Firestore adapter is present,
  // it will overwrite via window.renderBucketItems().
  render();
})();
