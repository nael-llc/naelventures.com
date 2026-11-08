(function () {
  var year = String(new Date().getFullYear());
  ["year", "overviewYear"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = year;
  });
})();
