"""
SciPulse — Tests unitaires du poller Hacker News
Exécution : pytest tests/unit/test_hn_poller.py -v
"""

import pytest
from src.ingestion.hn_poller import extract_arxiv_id, prepare_hn_doc


class TestExtractArxivId:
    """Tests de la détection de liens ArXiv dans les URLs."""

    def test_standard_abs_url(self):
        assert extract_arxiv_id("https://arxiv.org/abs/2301.12345") == "2301.12345"

    def test_pdf_url(self):
        assert extract_arxiv_id("https://arxiv.org/pdf/2301.12345v2") == "2301.12345v2"

    def test_non_arxiv_url(self):
        assert extract_arxiv_id("https://github.com/some/repo") is None

    def test_none_url(self):
        assert extract_arxiv_id(None) is None

    def test_five_digit_id(self):
        assert extract_arxiv_id("https://arxiv.org/abs/2312.12345") == "2312.12345"


class TestPrepareHnDoc:
    """Tests de la transformation d'un item HN en document ES."""

    @pytest.fixture
    def sample_story(self):
        return {
            "id": 12345,
            "type": "story",
            "by": "testuser",
            "time": 1700000000,
            "title": "New paper on transformers",
            "url": "https://arxiv.org/abs/2311.00001",
            "score": 150,
            "descendants": 42,
        }

    @pytest.fixture
    def sample_comment(self):
        return {
            "id": 12346,
            "type": "comment",
            "by": "commenter",
            "time": 1700001000,
            "text": "Great paper!",
            "parent": 12345,
        }

    def test_story_has_correct_fields(self, sample_story):
        doc = prepare_hn_doc(sample_story)
        assert doc["hn_id"] == "12345"
        assert doc["type"] == "story"
        assert doc["score"] == 150
        assert doc["relation"] == {"name": "story"}

    def test_story_detects_arxiv_link(self, sample_story):
        doc = prepare_hn_doc(sample_story)
        assert doc["arxiv_id_linked"] == "2311.00001"

    def test_comment_has_parent_relation(self, sample_comment):
        doc = prepare_hn_doc(sample_comment)
        assert doc["relation"]["name"] == "comment"
        assert doc["relation"]["parent"] == "12345"

    def test_comment_no_arxiv_link(self, sample_comment):
        doc = prepare_hn_doc(sample_comment)
        assert doc.get("arxiv_id_linked") is None
