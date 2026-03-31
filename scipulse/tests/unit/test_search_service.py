"""
SciPulse — Tests unitaires du module de recherche
Exécution : pytest tests/unit/test_search_service.py -v
"""

import pytest
from unittest.mock import MagicMock, patch


class TestSciPulseSearch:
    """Tests du search_service (mockés — pas besoin d'un ES live)."""

    @pytest.fixture
    def mock_es(self):
        with patch("src.search.search_service.Elasticsearch") as MockES:
            instance = MockES.return_value
            yield instance

    @pytest.fixture
    def search(self, mock_es):
        from src.search.search_service import SciPulseSearch
        s = SciPulseSearch()
        s.es = mock_es
        return s

    # ── full_text ────────────────────────────────────────────────────

    def test_full_text_builds_multi_match(self, search, mock_es):
        """full_text doit envoyer une requête multi_match cross-fields."""
        mock_es.search.return_value = {"hits": {"hits": [], "total": {"value": 0}}}

        search.full_text("transformer attention")

        call_body = mock_es.search.call_args[1]["body"]
        func_score = call_body["query"]["function_score"]
        multi_match = func_score["query"]["bool"]["must"][0]["multi_match"]
        assert multi_match["query"] == "transformer attention"
        assert multi_match["type"] == "cross_fields"
        assert "title^3" in multi_match["fields"]

    def test_full_text_includes_highlight(self, search, mock_es):
        """full_text doit demander le highlighting sur abstract et title."""
        mock_es.search.return_value = {"hits": {"hits": [], "total": {"value": 0}}}

        search.full_text("neural network")

        call_body = mock_es.search.call_args[1]["body"]
        assert "highlight" in call_body
        assert "abstract" in call_body["highlight"]["fields"]
        assert "title" in call_body["highlight"]["fields"]

    def test_full_text_with_hn_filter(self, search, mock_es):
        """full_text avec min_hn_score doit ajouter un filtre range."""
        mock_es.search.return_value = {"hits": {"hits": [], "total": {"value": 0}}}

        search.full_text("diffusion model", min_hn_score=50)

        call_body = mock_es.search.call_args[1]["body"]
        filters = call_body["query"]["function_score"]["query"]["bool"]["filter"]
        range_filter = filters[0]["range"]
        assert range_filter["hn_score"]["gte"] == 50

    # ── more_like_this ───────────────────────────────────────────────

    def test_mlt_uses_correct_id(self, search, mock_es):
        """more_like_this doit utiliser l'arxiv_id comme document source."""
        mock_es.search.return_value = {"hits": {"hits": [], "total": {"value": 0}}}

        search.more_like_this("2301.12345")

        call_body = mock_es.search.call_args[1]["body"]
        mlt = call_body["query"]["more_like_this"]
        assert mlt["like"][0]["_id"] == "2301.12345"
        assert "abstract" in mlt["fields"]

    # ── significant_terms ────────────────────────────────────────────

    def test_significant_terms_with_category(self, search, mock_es):
        """significant_terms avec catégorie doit filtrer sur le champ categories."""
        mock_es.search.return_value = {"aggregations": {}}

        search.significant_terms(category="cs.AI", date_from="2024-01-01")

        call_body = mock_es.search.call_args[1]["body"]
        filters = call_body["query"]["bool"]["filter"]
        assert any("term" in f for f in filters)
        assert any("range" in f for f in filters)

    # ── suggest ──────────────────────────────────────────────────────

    def test_suggest_sends_phrase_suggest(self, search, mock_es):
        """suggest doit envoyer une requête phrase suggest."""
        mock_es.search.return_value = {"suggest": {"title_suggest": []}}

        search.suggest("convlutional nueral")

        call_body = mock_es.search.call_args[1]["body"]
        assert "suggest" in call_body
        assert call_body["suggest"]["title_suggest"]["text"] == "convlutional nueral"

    # ── phrase_search ────────────────────────────────────────────────

    def test_phrase_search_with_slop(self, search, mock_es):
        """phrase_search doit envoyer une match_phrase avec slop."""
        mock_es.search.return_value = {"hits": {"hits": [], "total": {"value": 0}}}

        search.phrase_search("neural network architecture", slop=3)

        call_body = mock_es.search.call_args[1]["body"]
        mp = call_body["query"]["match_phrase"]["abstract"]
        assert mp["query"] == "neural network architecture"
        assert mp["slop"] == 3
