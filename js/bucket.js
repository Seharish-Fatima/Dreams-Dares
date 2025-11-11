// js/bucket.js — Bucket List page logic (ES module)
import {
  getState,
  addBucketItem,
  updateBucketItem,
  archiveBucketItem,
} from "./storage.js";
import {
  filesToDataUrls,
  escapeHTML,
  formatDate,
  openModal,
  closeModal,
} from "./utils.js";

(function () {
  const grid = document.getElementById("bucketGrid");
  const modal = document.getElementById("bucketModal");
  const form = document.getElementById("bucketForm");
  const addBtn = document.getElementById("addEntryBtn");
  const modalTitle = document.getElementById("modalTitle");

  // Safety guards
  if (!grid || !modal || !form) {
    console.warn("[Bucket] Required DOM nodes missing.");
    return;
  }

  // Open "new item" modal
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      form.reset();
      // ensure hidden id field exists
      if (!form.id) {
        const hid = document.createElement("input");
        hid.type = "hidden";
        hid.name = "id";
        form.appendChild(hid);
      }
      form.id.value = "";
      if (form.status) form.status.value = "todo";
      if (modalTitle) modalTitle.textContent = "New Bucket Item";
      openModal(modal);
    });
  }

  // Modal close interactions
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
  modal
    .querySelectorAll("[data-close-modal]")
    .forEach((b) => b.addEventListener("click", () => closeModal(modal)));

  // Create / Update submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    // Cover image — only first file used
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
    if (id) {
      updateBucketItem(id, payload);
    } else {
      addBucketItem(payload);
    }

    closeModal(modal);
    render();
  });

  // Render list/grid
  function render() {
    const s = getState();
    const items = (s.bucketList || [])
      .filter((i) => !i.archived)
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!items.length) {
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

  // Build a card node
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
      `created ${formatDate(it.createdAt)}`,
      it.location ? it.location : null,
      it.dueDate ? `due ${it.dueDate}` : null,
    ].filter(Boolean);
    meta.textContent = bits.join(" · ");

    // status dropdown
    const statusSel = document.createElement("select");
    statusSel.className = "bucket-status";
    statusSel.innerHTML = `
      <option value="todo">To-Do</option>
      <option value="done">Done</option>
    `;
    statusSel.value = it.status === "done" ? "done" : "todo";
    statusSel.addEventListener("change", () => {
      updateBucketItem(it.id, { status: statusSel.value });
      render();
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
    delBtn.addEventListener("click", () => softDelete(it));

    controls.appendChild(statusSel);
    controls.appendChild(editBtn);
    controls.appendChild(delBtn);

    body.appendChild(h);
    body.appendChild(meta);
    if (it.notes) body.appendChild(notes);
    body.appendChild(controls);

    el.appendChild(img);
    el.appendChild(body);
    return el;
  }

  // Open modal prefilled for edit
  function openEdit(it) {
    form.reset();
    if (!form.id) {
      const hid = document.createElement("input");
      hid.type = "hidden";
      hid.name = "id";
      form.appendChild(hid);
    }
    if (modalTitle) modalTitle.textContent = "Edit Bucket Item";

    form.id.value = it.id;
    form.title.value = it.title || "";
    form.location.value = it.location || "";
    form.dueDate.value = it.dueDate || "";
    if (form.status) form.status.value = it.status || "todo";
    form.notes.value = it.notes || "";
    // image: not prefilled; uploading a new one overwrites
    openModal(modal);
  }

  // Soft delete (archive)
  function softDelete(it) {
    if (
      confirm(
        "Archive this item? (You can add an Archive page later to restore.)"
      )
    ) {
      archiveBucketItem(it.id);
      render();
    }
  }

  // boot
  render();
})();
