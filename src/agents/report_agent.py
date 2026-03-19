import json
import logging
import os
from langchain_core.messages import SystemMessage, HumanMessage
from src.services.llm import create_llm, _extract_text

log = logging.getLogger("bodhi.report_agent")

_SYSTEM_PROMPT_BASE = """You are an expert technical recruiter and hiring manager.
Your task is to analyze a candidate's interview transcript, sentiment data, and proctoring violations to generate a detailed, professional hiring recommendation.

You must return a valid JSON object with the following keys:
- "hiring_recommendation": A detailed paragraph explaining your final recommendation (e.g. advance, reject, follow-up).
- "top_strengths": A list of up to 5 strings detailing the candidate's strongest points based on the transcript and metrics.
- "top_improvements": A list of up to 5 strings detailing areas where the candidate struggled or fell short.
- "cross_section_insights": A list of up to 5 strings noting any patterns (e.g. "Struggled with system design but excelled in coding", or "Showed nervous sentiment during DSA").
- "custom_metric_scores": A dict mapping each provided custom metric name to a brief 1-sentence assessment. If no custom metrics are provided, return an empty dict.

Format your output strictly as JSON. No markdown formatting like ```json.
"""

def generate_agentic_report_summary(
    transcript_text: str,
    sentiment_summary: dict,
    proctoring_summary: dict,
    phase_scores: dict,
    custom_metrics: list[str] | None = None,
) -> dict:
    llm = create_llm(api_key=os.getenv("GOOGLE_API_KEY", ""))

    custom_metrics = custom_metrics or []
    system_prompt = _SYSTEM_PROMPT_BASE
    if custom_metrics:
        metrics_list = "\n".join(f"  - {m}" for m in custom_metrics)
        system_prompt += (
            f"\n\nCUSTOM COMPANY METRICS:\nThe company has specified these custom evaluation dimensions. "
            f"For each metric below, provide a brief 1-sentence assessment in \"custom_metric_scores\":\n"
            f"{metrics_list}\n"
        )

    prompt = f"""
CANDIDATE DATA:
Phase Scores Summary: {json.dumps(phase_scores)}
Behavioral Sentiment Summary: {json.dumps(sentiment_summary)}
Proctoring Summary: {json.dumps(proctoring_summary)}
Custom Metrics to Evaluate: {json.dumps(custom_metrics)}

TRANSCRIPT:
{transcript_text[:15000]}

Generate the hiring analysis JSON now.
"""
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ])
        raw = _extract_text(response.content).strip()
        if raw.startswith("```json"): raw = raw[7:]
        if raw.startswith("```"): raw = raw[3:]
        if raw.endswith("```"): raw = raw[:-3]

        data = json.loads(raw.strip())
        return {
            "hiring_recommendation": data.get("hiring_recommendation", ""),
            "top_strengths": data.get("top_strengths", []),
            "top_improvements": data.get("top_improvements", []),
            "cross_section_insights": data.get("cross_section_insights", []),
            "custom_metric_scores": data.get("custom_metric_scores", {}),
        }
    except Exception as e:
        log.error(f"Report agent failed: {e}")
        return {}
