// Runs before first paint so the saved theme never flashes. Light is the default, same as the site.
(function () {
  try {
    var t = localStorage.getItem("lattice-admin-theme");
    document.documentElement.dataset.theme = t === "dark" ? "dark" : "light";
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
