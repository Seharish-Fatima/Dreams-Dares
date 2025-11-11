// utils.js — common helpers for section pages

export function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return Promise.resolve([]);
  return Promise.all(
    files.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(f);
        })
    )
  );
}

export function escapeHTML(s) {
  return (s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
  );
}

export function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return "";
  }
}

// ✅ a11y-safe modal helpers
export function openModal(modalEl) {
  if (!modalEl) return;

  modalEl.classList.add("show");
  modalEl.setAttribute("open", "");

  const main = document.querySelector("main");
  const header = document.querySelector("header");
  if (main) {
    main.inert = true;
    main.setAttribute("aria-hidden", "true");
  }
  if (header) {
    header.inert = true;
    header.setAttribute("aria-hidden", "true");
  }

  const first = modalEl.querySelector(
    "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
  );
  (first || modalEl).focus?.();
}

export function closeModal(modalEl) {
  if (!modalEl) return;

  modalEl.classList.remove("show");
  modalEl.removeAttribute("open");

  const main = document.querySelector("main");
  const header = document.querySelector("header");
  if (main) {
    main.inert = false;
    main.removeAttribute("aria-hidden");
  }
  if (header) {
    header.inert = false;
    header.removeAttribute("aria-hidden");
  }
}

export async function compressImages(imgs) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const output = [];

  for (const src of imgs) {
    const img = new Image();
    await new Promise((r) => {
      img.onload = r;
      img.src = src;
    });
    const maxW = 600; // limit width for compression
    const scale = Math.min(1, maxW / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    output.push(canvas.toDataURL("image/jpeg", 0.65)); // compressed image
  }
  return output;
}
