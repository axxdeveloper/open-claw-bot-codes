(function () {
  var pres = document.querySelectorAll(".page__content pre");
  pres.forEach(function (pre) {
    if (pre.querySelector(".code-line")) return;
    var code = pre.querySelector("code");
    var el = code || pre;
    var text = el.innerHTML;
    var lines = text.replace(/\n$/, "").split("\n");
    if (lines.length < 2) return;
    el.innerHTML = lines
      .map(function (l) {
        return '<span class="code-line">' + (l || " ") + "</span>";
      })
      .join("");
  });
})();
