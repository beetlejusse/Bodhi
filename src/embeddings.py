"""Embedding generation using Google gemini-embedding-001 (3072-dim).

Note: text-embedding-004 was deprecated by Google on 2026-01-14.
The replacement is gemini-embedding-001, which outputs 3072-dim vectors.
If you have existing data in `company_documents`, you must DROP and recreate
the table (or re-run migrations) because the vector dimension changed from 768 to 3072.
"""

import os

from langchain_google_genai import GoogleGenerativeAIEmbeddings


_model: GoogleGenerativeAIEmbeddings | None = None


def _get_model() -> GoogleGenerativeAIEmbeddings:
    global _model
    if _model is None:
        api_key = os.getenv("GOOGLE_API_KEY", "")
        _model = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key,
        )
    return _model


def get_embedding(text: str) -> list[float]:
    """Embed a single text string. Returns a 768-dim float vector."""
    return _get_model().embed_query(text)


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts. Returns list of 768-dim float vectors."""
    if not texts:
        return []
    return _get_model().embed_documents(texts)
