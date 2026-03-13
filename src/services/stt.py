"""Saaras V3 Speech-to-Text via Sarvam AI."""

import asyncio
import base64
import io
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from sarvamai import SarvamAI
from sarvamai import AsyncSarvamAI

MAX_CHUNK_SEC = 25


def transcribe_audio_streaming(
    audio_bytes: bytes,
    *,
    api_key: str,
    model: str = "saaras:v3",
    mode: str = "codemix",
    language_code: str = "hi-IN",
) -> str:
    """
    Transcribe using Sarvam streaming API (lower latency than REST).
    Expects WAV, 16kHz, mono.
    """
    async def _run():
        client = AsyncSarvamAI(api_subscription_key=api_key)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        async with client.speech_to_text_streaming.connect(
            model=model,
            mode=mode,
            language_code=language_code,
            high_vad_sensitivity=True,
            vad_signals=True,
        ) as ws:
            await ws.transcribe(
                audio=audio_b64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            async for message in ws:
                if isinstance(message, dict):
                    if message.get("type") == "transcript":
                        text = message.get("text") or message.get("transcript")
                        if text:
                            return str(text)
                    continue
                transcript = _extract_transcript(message)
                if transcript:
                    return transcript
        return ""

    return asyncio.run(_run())


def _split_wav_chunks(audio_bytes: bytes, max_sec: int = MAX_CHUNK_SEC) -> list[bytes]:
    """Split WAV audio into chunks of at most *max_sec* seconds."""
    data, sr = sf.read(io.BytesIO(audio_bytes), dtype="int16")
    max_samples = max_sec * sr
    if len(data) <= max_samples:
        return [audio_bytes]
    chunks: list[bytes] = []
    for start in range(0, len(data), max_samples):
        segment = data[start : start + max_samples]
        buf = io.BytesIO()
        sf.write(buf, segment, sr, format="WAV")
        chunks.append(buf.getvalue())
    return chunks


def _transcribe_single(
    audio_bytes: bytes,
    *,
    client: SarvamAI,
    model: str,
    mode: str,
    language_code: str,
) -> str:
    """Transcribe a single <=25s WAV chunk."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        path = Path(f.name)
    try:
        with open(path, "rb") as audio_file:
            response = client.speech_to_text.transcribe(
                file=audio_file,
                model=model,
                mode=mode,
                language_code=language_code,
            )
        return _extract_transcript(response)
    finally:
        path.unlink(missing_ok=True)


def transcribe_audio(
    audio_bytes: bytes,
    *,
    api_key: str,
    model: str = "saaras:v3",
    mode: str = "transcribe",
    language_code: str = "en-IN",
) -> str:
    """
    Transcribe audio bytes to text using Saaras V3.
    Auto-chunks audio >25s into segments to stay within API limits.
    Expects WAV format, 16kHz, mono.
    """
    client = SarvamAI(api_subscription_key=api_key)
    chunks = _split_wav_chunks(audio_bytes)
    parts = [
        _transcribe_single(
            chunk, client=client, model=model, mode=mode, language_code=language_code
        )
        for chunk in chunks
    ]
    return " ".join(p for p in parts if p)


def _extract_transcript(response) -> str:
    """Extract transcript text from Sarvam STT response."""
    if hasattr(response, "transcript"):
        return response.transcript or ""
    if hasattr(response, "text"):
        return response.text or ""
    if isinstance(response, str):
        return response
    if isinstance(response, dict):
        return response.get("transcript", response.get("text", "")) or ""
    return str(response)
