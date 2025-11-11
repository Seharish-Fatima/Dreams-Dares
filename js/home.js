// home.js — minimal, no global add, no storage, no modal

(function () {
  // 1) Brand → home (redundant but robust if someone strips hrefs)
  const brand = document.querySelector(".dd-brand");
  const logo = document.querySelector(".dd-logo");
  const titleLink = document.querySelector(".dd-titles a");

  function goHome(e) {
    e?.preventDefault?.();
    // Always go to the home file explicitly
    window.location.href = "index.html";
  }
  brand?.addEventListener("click", goHome);
  logo?.addEventListener("click", goHome);
  titleLink?.addEventListener("click", goHome);

  // 2) (Optional) animate grid on first paint
  const grid = document.getElementById("homeGrid");
  if (grid) grid.classList.add("dd-fade-in");
})();
