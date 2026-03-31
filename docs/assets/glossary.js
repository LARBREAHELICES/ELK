(function () {
  function initGlossaryTooltips() {
    var terms = document.querySelectorAll('.glossary-term');
    if (!terms.length) return;

    var tooltip = document.createElement('div');
    tooltip.className = 'glossary-tooltip';
    document.body.appendChild(tooltip);

    var setTooltipPosition = function (event) {
      var offset = 14;
      var maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
      var maxTop = window.innerHeight - tooltip.offsetHeight - 12;
      tooltip.style.left = Math.min(event.clientX + offset, maxLeft) + 'px';
      tooltip.style.top = Math.min(event.clientY + offset, maxTop) + 'px';
    };

    terms.forEach(function (term) {
      term.addEventListener('mouseenter', function (event) {
        var text = term.getAttribute('data-definition');
        if (!text) return;
        tooltip.textContent = text;
        tooltip.classList.add('show');
        setTooltipPosition(event);
      });

      term.addEventListener('mousemove', setTooltipPosition);
      term.addEventListener('mouseleave', function () {
        tooltip.classList.remove('show');
      });
    });
  }

  window.initGlossaryTooltips = initGlossaryTooltips;
})();
