(function () {
  var MAX_TOTAL_MARKERS = 90;
  var DEFAULT_MAX_MATCHES = 2;

  var GLOSSARY_TERMS = [
    {
      id: 'elk',
      pattern: 'ELK',
      definition: 'Stack composee de Elasticsearch, Logstash et Kibana pour ingerer, stocker, rechercher et visualiser des donnees.',
      maxMatches: 2
    },
    {
      id: 'elasticsearch',
      pattern: 'Elasticsearch',
      definition: 'Moteur de recherche et d analytics distribue, base sur des documents JSON et interroge via API HTTP.',
      maxMatches: 3
    },
    {
      id: 'logstash',
      pattern: 'Logstash',
      definition: 'Outil d ingestion qui lit, transforme et route les donnees avant indexation dans Elasticsearch.',
      maxMatches: 3
    },
    {
      id: 'kibana',
      pattern: 'Kibana',
      definition: 'Interface web pour explorer les donnees Elasticsearch, creer des visualisations et des dashboards.',
      maxMatches: 2
    },
    {
      id: 'jupyter',
      pattern: 'Jupyter',
      definition: 'Environnement de notebooks pour executer du code (souvent Python) et documenter une analyse reproductible.',
      maxMatches: 2
    },
    {
      id: 'index',
      pattern: 'index(?:es)?',
      definition: 'Conteneur logique de documents dans Elasticsearch, comparable a une table en base relationnelle.',
      maxMatches: 2
    },
    {
      id: 'document',
      pattern: 'document(?:s)?',
      definition: 'Unite de donnees JSON stockee dans un index Elasticsearch.',
      maxMatches: 2
    },
    {
      id: 'mapping',
      pattern: 'mapping',
      definition: 'Schema qui definit les types de champs et la facon dont Elasticsearch les indexe.',
      maxMatches: 3
    },
    {
      id: 'champ',
      pattern: 'champ(?:s)?',
      definition: 'Propriete d un document (ex: title, release_date, vote_average).',
      maxMatches: 2
    },
    {
      id: 'analyzer',
      pattern: 'analy[sz]er(?:s)?|analyseur(?:s)?',
      definition: 'Pipeline de traitement de texte (tokenizer + filtres) utilise pour la recherche full text.',
      maxMatches: 2
    },
    {
      id: 'tokenizer',
      pattern: 'tokenizer',
      definition: 'Composant qui decoupe un texte en tokens (mots ou sous-mots).',
      maxMatches: 2
    },
    {
      id: 'token',
      pattern: 'token(?:s)?',
      definition: 'Element textuel produit par l analyseur et utilise pour l indexation et la recherche.',
      maxMatches: 2
    },
    {
      id: 'index-inverse',
      pattern: 'index\\s+invers[ée]',
      definition: 'Structure qui associe chaque terme aux documents qui le contiennent.',
      maxMatches: 2
    },
    {
      id: 'query-dsl',
      pattern: 'query\\s*dsl',
      definition: 'Langage JSON d Elasticsearch pour exprimer requetes, filtres, tris et aggregations.',
      maxMatches: 2
    },
    {
      id: 'full-text',
      pattern: 'full[-\\s]?text',
      definition: 'Recherche dans du texte analyse, basee sur les termes/token et la pertinence.',
      maxMatches: 2
    },
    {
      id: 'agregation',
      pattern: 'agr[ée]gation(?:s)?|aggregation(?:s)?',
      definition: 'Calcul analytique dans Elasticsearch (groupements, metriques, histogrammes, etc.).',
      maxMatches: 2
    },
    {
      id: 'bucket',
      pattern: 'bucket(?:s)?',
      definition: 'Seau d aggregation qui regroupe des documents selon une regle (terme, intervalle, date...).',
      maxMatches: 2
    },
    {
      id: 'metrique',
      pattern: 'm[ée]trique(?:s)?|metric(?:s)?',
      definition: 'Valeur calculee sur un ensemble de documents (count, min, max, avg, sum...).',
      maxMatches: 2
    },
    {
      id: 'cluster',
      pattern: 'cluster',
      definition: 'Ensemble de noeuds Elasticsearch qui cooperent pour stocker et servir les donnees.',
      maxMatches: 2
    },
    {
      id: 'node',
      pattern: 'node(?:s)?|n[oe]ud(?:s)?',
      definition: 'Instance Elasticsearch qui fait partie d un cluster.',
      maxMatches: 2
    },
    {
      id: 'shard',
      pattern: 'shard(?:s)?',
      definition: 'Partition d un index, repartie sur les noeuds pour distribuer stockage et requetes.',
      maxMatches: 2
    },
    {
      id: 'replica',
      pattern: 'replica(?:s)?|r[ée]plique(?:s)?',
      definition: 'Copie d un shard primaire pour tolerance de panne et lectures paralleles.',
      maxMatches: 2
    },
    {
      id: 'ingestion',
      pattern: 'ingestion',
      definition: 'Phase d entree des donnees dans la stack, avec parsing, nettoyage et enrichissement.',
      maxMatches: 2
    },
    {
      id: 'pipeline',
      pattern: 'pipeline(?:s)?',
      definition: 'Suite d etapes de traitement des donnees (input -> filter -> output).',
      maxMatches: 2
    },
    {
      id: 'csv',
      pattern: 'CSV',
      definition: 'Format texte tabulaire separe par delimitateur, frequemment utilise pour l import de donnees.',
      maxMatches: 2
    },
    {
      id: 'jsonl-ndjson',
      pattern: 'JSONL|NDJSON',
      definition: 'Format JSON ligne par ligne, utilise notamment par le Bulk API.',
      maxMatches: 2
    },
    {
      id: 'grok',
      pattern: 'grok',
      definition: 'Plugin Logstash base sur des patterns pour extraire des champs depuis du texte brut.',
      maxMatches: 2
    },
    {
      id: 'regex',
      pattern: 'regex|expressions?\\s+r[ée]guli[èe]res?',
      definition: 'Motif textuel pour reconnaitre, extraire ou transformer des chaines de caracteres.',
      maxMatches: 2
    },
    {
      id: 'sincedb',
      pattern: 'sincedb',
      definition: 'Fichier Logstash qui memorise la position de lecture des fichiers ingeres.',
      maxMatches: 2
    },
    {
      id: 'mutate',
      pattern: 'mutate',
      definition: 'Plugin Logstash pour transformer des champs: convert, rename, strip, lowercase, gsub, etc.',
      maxMatches: 2
    },
    {
      id: 'fingerprint',
      pattern: 'fingerprint',
      definition: 'Hash calcule a partir de champs pour creer un identifiant stable et limiter les doublons.',
      maxMatches: 2
    },
    {
      id: 'bulk-api',
      pattern: 'bulk\\s*api|\\bbulk\\b',
      definition: 'API Elasticsearch d indexation en masse via NDJSON, plus performante que des insertions une a une.',
      maxMatches: 2
    },
    {
      id: 'reindex',
      pattern: 'reindex(?:ation)?',
      definition: 'Copie de documents vers un nouvel index, souvent pour corriger un mapping ou faire evoluer un schema.',
      maxMatches: 2
    },
    {
      id: 'alias',
      pattern: 'alias',
      definition: 'Nom logique pointant vers un ou plusieurs index, utile pour bascules sans interruption.',
      maxMatches: 2
    },
    {
      id: 'data-view',
      pattern: 'data\\s*view',
      definition: 'Configuration Kibana qui definit quels index lire et quels champs exposer.',
      maxMatches: 2
    },
    {
      id: 'discover',
      pattern: 'discover',
      definition: 'Vue Kibana pour explorer les documents et tester rapidement des filtres.',
      maxMatches: 2
    },
    {
      id: 'lens',
      pattern: 'lens',
      definition: 'Editeur visuel Kibana pour construire des graphiques via drag and drop.',
      maxMatches: 2
    },
    {
      id: 'dashboard',
      pattern: 'dashboard(?:s)?',
      definition: 'Tableau de bord Kibana qui assemble plusieurs visualisations sur une meme vue.',
      maxMatches: 2
    },
    {
      id: 'runtime-field',
      pattern: 'runtime\\s*field(?:s)?',
      definition: 'Champ calcule a la vollee a la requete, sans reindexer les documents.',
      maxMatches: 2
    },
    {
      id: 'emit',
      pattern: '\\bemit\\b',
      definition: 'Instruction utilisee dans un runtime field pour retourner la valeur calculee.',
      maxMatches: 2
    },
    {
      id: 'painless',
      pattern: 'painless',
      definition: 'Langage de script d Elasticsearch pour des calculs dynamiques et transformations.',
      maxMatches: 2
    }
  ];

  var tooltip;
  var behaviorBound = false;
  var initialized = false;
  var wordCharRegex;

  try {
    wordCharRegex = new RegExp('[\\p{L}\\p{N}_]', 'u');
  } catch (error) {
    wordCharRegex = /[A-Za-z0-9_À-ÖØ-öø-ÿ]/;
  }

  var compiledTerms = GLOSSARY_TERMS
    .map(function (term) {
      return {
        id: term.id,
        regex: new RegExp(term.pattern, 'giu'),
        definition: term.definition,
        maxMatches: typeof term.maxMatches === 'number' ? term.maxMatches : DEFAULT_MAX_MATCHES,
        weight: term.pattern.length
      };
    })
    .sort(function (a, b) {
      return b.weight - a.weight;
    });

  function isWordChar(char) {
    return !!char && wordCharRegex.test(char);
  }

  function isBoundary(text, start, end) {
    var previous = start > 0 ? text.charAt(start - 1) : '';
    var next = end < text.length ? text.charAt(end) : '';
    return !isWordChar(previous) && !isWordChar(next);
  }

  function shouldSkipNode(node) {
    if (!node || !node.parentElement) return true;
    if (!node.nodeValue || !node.nodeValue.trim()) return true;

    var skipSelector = [
      'code',
      'pre',
      'kbd',
      'samp',
      'var',
      'script',
      'style',
      'textarea',
      'input',
      'button',
      'select',
      'option',
      'a',
      '.glossary-term',
      '.glossary-tooltip',
      '.top-nav'
    ].join(',');

    return !!node.parentElement.closest(skipSelector);
  }

  function getAnnotationRoots() {
    var selectors = [
      '.reveal .slides',
      'article.content',
      '.content',
      '.cards',
      '.wrap',
      'main',
      'article',
      'section'
    ];

    var roots = [];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        if (node && !roots.includes(node)) roots.push(node);
      });
    });

    if (!roots.length && document.body) roots.push(document.body);
    return roots;
  }

  function findBestMatch(text, cursor, counters, totalCount) {
    var best = null;

    for (var i = 0; i < compiledTerms.length; i += 1) {
      var term = compiledTerms[i];
      if (totalCount >= MAX_TOTAL_MARKERS) break;
      if ((counters[term.id] || 0) >= term.maxMatches) continue;

      term.regex.lastIndex = cursor;
      var match = term.regex.exec(text);

      while (match) {
        var start = match.index;
        var end = start + match[0].length;

        if (start < cursor) {
          term.regex.lastIndex = start + 1;
          match = term.regex.exec(text);
          continue;
        }

        if (!isBoundary(text, start, end)) {
          term.regex.lastIndex = start + 1;
          match = term.regex.exec(text);
          continue;
        }

        var candidate = {
          term: term,
          start: start,
          end: end,
          value: match[0]
        };

        if (
          !best ||
          candidate.start < best.start ||
          (candidate.start === best.start && candidate.value.length > best.value.length)
        ) {
          best = candidate;
        }
        break;
      }
    }

    return best;
  }

  function annotateTextNode(node, state) {
    var text = node.nodeValue;
    var cursor = 0;
    var changed = false;
    var fragment = document.createDocumentFragment();

    while (cursor < text.length && state.total < MAX_TOTAL_MARKERS) {
      var match = findBestMatch(text, cursor, state.counts, state.total);
      if (!match) break;

      if (match.start > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, match.start)));
      }

      var span = document.createElement('span');
      span.className = 'glossary-term';
      span.setAttribute('data-definition', match.term.definition);
      span.setAttribute('tabindex', '0');
      span.setAttribute('aria-label', match.value + ': ' + match.term.definition);
      span.textContent = match.value;
      fragment.appendChild(span);

      state.counts[match.term.id] = (state.counts[match.term.id] || 0) + 1;
      state.total += 1;
      changed = true;
      cursor = match.end;
    }

    if (!changed) return false;
    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    node.parentNode.replaceChild(fragment, node);
    return true;
  }

  function annotateGlossaryTerms() {
    var roots = getAnnotationRoots();
    var state = { counts: {}, total: 0 };

    roots.forEach(function (root) {
      if (!root) return;

      var walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            return shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      for (var i = 0; i < nodes.length; i += 1) {
        if (state.total >= MAX_TOTAL_MARKERS) return;
        annotateTextNode(nodes[i], state);
      }
    });
  }

  function ensureGlossaryStyles() {
    if (document.getElementById('glossary-inline-style')) return;

    var style = document.createElement('style');
    style.id = 'glossary-inline-style';
    style.textContent = [
      '.glossary-term {',
      '  border-bottom: 1px dashed rgba(56, 189, 248, 0.9);',
      '  cursor: help;',
      '  white-space: normal;',
      '}',
      '.glossary-term:hover, .glossary-term:focus {',
      '  color: #38bdf8;',
      '  outline: none;',
      '}',
      '.glossary-tooltip {',
      '  position: fixed;',
      '  z-index: 10000;',
      '  max-width: 360px;',
      '  padding: 10px 12px;',
      '  border-radius: 8px;',
      '  border: 1px solid rgba(56, 189, 248, 0.4);',
      '  background: rgba(15, 23, 42, 0.97);',
      '  color: #e2e8f0;',
      '  font-size: 14px;',
      '  line-height: 1.4;',
      '  pointer-events: none;',
      '  opacity: 0;',
      '  transform: translateY(6px);',
      '  transition: opacity 0.12s ease, transform 0.12s ease;',
      '  box-shadow: 0 12px 30px rgba(2, 8, 23, 0.45);',
      '}',
      '.glossary-tooltip.show {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function ensureTooltipElement() {
    if (tooltip) return;
    tooltip = document.createElement('div');
    tooltip.className = 'glossary-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    document.body.appendChild(tooltip);
  }

  function positionTooltipFromPoint(x, y) {
    if (!tooltip) return;

    var offset = 14;
    var maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
    var maxTop = window.innerHeight - tooltip.offsetHeight - 12;
    tooltip.style.left = Math.max(12, Math.min(x + offset, maxLeft)) + 'px';
    tooltip.style.top = Math.max(12, Math.min(y + offset, maxTop)) + 'px';
  }

  function positionTooltipFromElement(element) {
    if (!tooltip || !element) return;
    var rect = element.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.bottom;
    positionTooltipFromPoint(x, y);
  }

  function showTooltip(termElement, event) {
    if (!tooltip || !termElement) return;
    var text = termElement.getAttribute('data-definition');
    if (!text) return;

    tooltip.textContent = text;
    tooltip.classList.add('show');

    if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      positionTooltipFromPoint(event.clientX, event.clientY);
    } else {
      positionTooltipFromElement(termElement);
    }
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove('show');
  }

  function bindTooltipBehavior() {
    if (behaviorBound) return;
    behaviorBound = true;

    document.addEventListener('mouseover', function (event) {
      var termElement = event.target && event.target.closest ? event.target.closest('.glossary-term') : null;
      if (!termElement) return;
      showTooltip(termElement, event);
    });

    document.addEventListener('mousemove', function (event) {
      if (!tooltip || !tooltip.classList.contains('show')) return;
      positionTooltipFromPoint(event.clientX, event.clientY);
    });

    document.addEventListener('mouseout', function (event) {
      var termElement = event.target && event.target.closest ? event.target.closest('.glossary-term') : null;
      if (!termElement) return;

      var related = event.relatedTarget;
      if (related && related.closest && related.closest('.glossary-term') === termElement) return;
      hideTooltip();
    });

    document.addEventListener('focusin', function (event) {
      var termElement = event.target && event.target.closest ? event.target.closest('.glossary-term') : null;
      if (!termElement) return;
      showTooltip(termElement);
    });

    document.addEventListener('focusout', function (event) {
      var termElement = event.target && event.target.closest ? event.target.closest('.glossary-term') : null;
      if (!termElement) return;
      hideTooltip();
    });

    document.addEventListener('click', function (event) {
      var termElement = event.target && event.target.closest ? event.target.closest('.glossary-term') : null;
      if (termElement) {
        showTooltip(termElement, event);
      } else if (tooltip && tooltip.classList.contains('show')) {
        hideTooltip();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') hideTooltip();
    });

    window.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('resize', hideTooltip);
  }

  function initGlossaryTooltips() {
    ensureGlossaryStyles();
    ensureTooltipElement();
    annotateGlossaryTerms();
    bindTooltipBehavior();
    initialized = true;
  }

  window.initGlossaryTooltips = initGlossaryTooltips;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!initialized) initGlossaryTooltips();
    });
  } else {
    initGlossaryTooltips();
  }
})();
