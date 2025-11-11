import { getState, saveState, uid } from "./storage.js";
import {
  filesToDataUrls,
  formatDate,
  openModal,
  closeModal,
  compressImages,
} from "./utils.js";

(function () {
  const grid = document.getElementById("pbGrid");
  const addBtn = document.getElementById("pbAddBtn");
  const modal = document.getElementById("pbModal");
  const form = document.getElementById("pbForm");
  const titleEl = document.getElementById("pbModalTitle");
  const editHint = document.getElementById("pbEditHint");

  // open create
  addBtn.addEventListener("click", () => {
    form.reset();
    ensureHiddenId(form);
    form.id.value = "";
    titleEl.textContent = "New Upload";
    editHint.style.display = "none";
    openModal(modal);
  });

  // close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
  modal
    .querySelectorAll("[data-close-modal]")
    .forEach((b) => b.addEventListener("click", () => closeModal(modal)));

  // submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const files = form.querySelector('input[name="media"]').files;
    let imgs = await filesToDataUrls(files);
    imgs = await compressImages(imgs);
    try {
      imgs = await filesToDataUrls(files);
    } catch (err) {
      console.error("Image read error", err);
    }
    if (!imgs.length && id) {
      // editing: keep existing images if user didn’t upload new ones
      const existing = getState().photoBooth?.find((x) => x.id === id);
      imgs = existing?.images || [];
    }

    const payload = {
      title: (fd.get("title") || "").toString().trim(),
      desc: (fd.get("desc") || "").toString().trim(),
      images: imgs, // may be empty on edit → keep old
    };

    const id = (fd.get("id") || "").toString();
    const s = getState();
    s.photoBooth = s.photoBooth || [];

    if (id) {
      const it = s.photoBooth.find((x) => x.id === id);
      if (it) {
        it.title = payload.title || it.title;
        it.desc = payload.desc;
        if (imgs.length) it.images = imgs; // replace only if new chosen
        it.updatedAt = Date.now();
      }
    } else {
      s.photoBooth.push({
        id: uid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: payload.title || "Untitled",
        desc: payload.desc,
        images: imgs,
        archived: false,
      });
    }

    saveState(s);
    closeModal(modal);
    render();
  });

  function render() {
    const s = getState();
    const items = (s.photoBooth || [])
      .filter((i) => !i.archived)
      .slice()
      .sort(
        (a, b) =>
          (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
      );

    if (!items.length) {
      grid.innerHTML = `
        <div class="center">
          <div>
            <div style="font-size:42px;opacity:.9">📸</div>
            <p class="dd-card-meta" style="margin:8px 0 0">Drop your first chaos pic ✨</p>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = "";
    items.forEach((it) => grid.appendChild(card(it)));
  }

  function card(it) {
    const el = document.createElement("article");
    el.className = "pb-card dd-fade-in";

    const img = document.createElement("img");
    img.className = "pb-thumb";
    img.alt = it.title || "Photo";
    if (Array.isArray(it.images) && it.images.length) {
      img.src = it.images[0]; // first one as cover
    } else if (
      typeof it.images === "string" &&
      it.images.startsWith("data:image")
    ) {
      img.src = it.images;
    } else {
      img.src = placeholder();
    }
    const meta = document.createElement("div");
    meta.className = "pb-meta";

    const h = document.createElement("h3");
    h.className = "pb-title";
    h.textContent = it.title || "Untitled";

    const sub = document.createElement("p");
    sub.className = "pb-sub";
    const dateStr = formatDate(it.updatedAt || it.createdAt);
    sub.textContent = (it.desc ? it.desc + " · " : "") + dateStr;

    const actions = document.createElement("div");
    actions.className = "pb-actions";

    const editBtn = button("Edit", () => openEdit(it));
    const delBtn = button("Delete", () => softDelete(it));

    actions.append(editBtn, delBtn);
    meta.append(h, sub);

    el.append(img, meta, actions);
    return el;
  }

  function button(label, onClick) {
    const b = document.createElement("button");
    b.className = "dd-btn";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function openEdit(it) {
    form.reset();
    ensureHiddenId(form);
    form.id.value = it.id;
    form.title.value = it.title || "";
    form.desc.value = it.desc || "";
    titleEl.textContent = "Edit Upload";
    // note for files: optional; leaving empty keeps current images
    editHint.style.display = "block";
    openModal(modal);
  }

  function softDelete(it) {
    if (!confirm("Delete this upload?")) return;
    const s = getState();
    s.photoBooth = (s.photoBooth || []).map((x) =>
      x.id === it.id ? { ...x, archived: true } : x
    );
    saveState(s);
    render();
  }

  function placeholder() {
    return (
      "data:image/svg+xml;base64," +
      btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="rgba(255,255,255,0.04)"/>
        <text x="50%" y="52%" text-anchor="middle" fill="#f5d5e0" font-family="Inter, sans-serif" font-size="16">No Image</text>
      </svg>`
      )
    );
  }

  function ensureHiddenId(form) {
    if (!form.id) {
      const hid = document.createElement("input");
      hid.type = "hidden";
      hid.name = "id";
      form.appendChild(hid);
    }
  }

  // init
  render();
})();
