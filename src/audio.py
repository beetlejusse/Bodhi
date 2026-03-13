"""Microphone recording and playback utilities."""

import collections
import io
import os
import queue
import time

import numpy as np
import sounddevice as sd
import soundfile as sf
import webrtcvad

SAMPLE_RATE = 16000
CHANNELS = 1
DTYPE = "int16"
FRAME_DURATION_MS = 20
FRAME_SIZE = int(SAMPLE_RATE * FRAME_DURATION_MS / 1000) * 2  # 16-bit = 2 bytes


def get_input_device():
    """Resolve input device from BODHI_INPUT_DEVICE env (index or name), else system default."""
    val = os.getenv("BODHI_INPUT_DEVICE", "").strip()
    if not val:
        return None
    try:
        return int(val)
    except ValueError:
        return val


def list_input_devices():
    """Print available input devices. Run: python -c \"from src.audio import list_input_devices; list_input_devices()\" """
    print("Input devices:")
    for i, dev in enumerate(sd.query_devices()):
        if dev["max_input_channels"] > 0:
            default = " [DEFAULT]" if i == sd.default.device[0] else ""
            print(f"  {i}: {dev['name']}{default}")


def record_until_silence(
    sample_rate: int = SAMPLE_RATE,
    silence_duration_ms: float = 1000,
    vad_aggressiveness: int = 3,
    max_duration_sec: float = 120.0,
    wait_for_enter: bool = False,
    min_recording_sec: float = 0.4,
    speech_confirm_frames: int = 5,
    energy_threshold: float = 80.0,
    device=None,
) -> bytes:
    """
    Record until VAD detects silence using a persistent InputStream.

    Waits indefinitely for speech to begin (no timeout before speech).
    Requires speech_confirm_frames consecutive VAD-positive frames (100ms
    at default settings) before committing, preventing ambient-noise
    false positives. A pre-buffer preserves audio just before speech onset.

    After speech ends, stops after silence_duration_ms of silence.
    max_duration_sec caps total speech time as a safety net.

    Returns WAV bytes (16kHz, mono, 16-bit).
    """
    if wait_for_enter:
        input("Press Enter when ready to speak... ")
        print("Recording... (stops after silence)")
    else:
        print("Listening... (speak now)")

    device = device if device is not None else get_input_device()
    vad = webrtcvad.Vad(vad_aggressiveness)
    num_silent_frames = int(silence_duration_ms / FRAME_DURATION_MS)
    min_frames = max(1, int(min_recording_sec * 1000 / FRAME_DURATION_MS))
    frame_samples = int(sample_rate * FRAME_DURATION_MS / 1000)

    audio_q: queue.Queue[np.ndarray] = queue.Queue()

    def _callback(indata, frames, time_info, status):
        audio_q.put(indata.copy())

    stream_kw = dict(
        samplerate=sample_rate,
        channels=CHANNELS,
        dtype=DTYPE,
        blocksize=frame_samples,
        callback=_callback,
    )
    if device is not None:
        stream_kw["device"] = device

    pre_buffer: collections.deque[np.ndarray] = collections.deque(
        maxlen=speech_confirm_frames + 25,
    )
    recordings: list[np.ndarray] = []
    num_silent = 0
    has_speech = False
    speech_start: float | None = None
    consecutive_speech = 0
    speech_count = 0

    with sd.InputStream(**stream_kw):
        while True:
            if has_speech and speech_start is not None:
                if time.monotonic() - speech_start > max_duration_sec:
                    break
            try:
                chunk = audio_q.get(timeout=0.5)
            except queue.Empty:
                continue

            frame = chunk.squeeze().tobytes()
            if len(frame) < FRAME_SIZE:
                continue

            is_speech = vad.is_speech(frame, sample_rate)
            rms = np.sqrt(np.mean(chunk.astype(np.float32) ** 2))
            if rms < energy_threshold:
                is_speech = False

            if is_speech:
                consecutive_speech += 1
            else:
                consecutive_speech = 0

            if not has_speech:
                pre_buffer.append(chunk.copy())
                if consecutive_speech >= speech_confirm_frames:
                    has_speech = True
                    speech_start = time.monotonic()
                    speech_count = consecutive_speech
                    recordings.extend(pre_buffer)
                    pre_buffer.clear()
            else:
                recordings.append(chunk.copy())
                if is_speech:
                    speech_count += 1
                    num_silent = 0
                else:
                    num_silent += 1
                    if (
                        len(recordings) >= min_frames
                        and num_silent >= num_silent_frames
                    ):
                        break

    if not recordings:
        return b""

    audio = np.concatenate(recordings, axis=0)
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format="WAV")
    return buffer.getvalue()


def record_seconds(duration_sec: float = 5.0, sample_rate: int = SAMPLE_RATE) -> bytes:
    """
    Record audio from microphone for given duration.
    Returns WAV bytes (16kHz, mono, 16-bit).
    """
    frames = int(duration_sec * sample_rate)
    recording = sd.rec(frames, samplerate=sample_rate, channels=CHANNELS, dtype=DTYPE)
    sd.wait()

    buffer = io.BytesIO()
    sf.write(buffer, recording, sample_rate, format="WAV")
    return buffer.getvalue()


def record_until_enter(sample_rate: int = SAMPLE_RATE, device=None) -> bytes:
    """
    Record from microphone until user presses Enter.
    Returns WAV bytes.
    """
    input("Press Enter to start recording... ")
    print("Recording... Press Enter to stop.")
    recordings = []

    def callback(indata, frames, time_info, status):
        if status:
            print(status, flush=True)
        recordings.append(indata.copy())

    stream_kw = dict(
        samplerate=sample_rate,
        channels=CHANNELS,
        dtype=DTYPE,
        blocksize=int(sample_rate * 0.1),
        callback=callback,
    )
    if device is not None:
        stream_kw["device"] = device
    with sd.InputStream(**stream_kw):
        input()

    if not recordings:
        return b""

    audio = np.concatenate(recordings, axis=0)
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format="WAV")
    return buffer.getvalue()
