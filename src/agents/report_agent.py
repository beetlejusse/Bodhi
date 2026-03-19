import json
import logging
import os
from langchain_core.messages import SystemMessage, HumanMessage
from src.services.llm import create_llm, _extract_text

log = logging.getLogger("bodhi.report_agent")

_SYSTEM_PROMPT = """You are an expert technical recruiter and hiring manager.
Your task is to analyze a candidate's interview transcript, sentiment data, and proctoring violations to generate a detailed, professional hiring recommendation.

You must return a valid JSON object with the following keys:
- "hiring_recommendation": A detailed paragraph explaining your final recommendation (e.g. advance, reject, follow-up).
- "top_strengths": A list of up to 5 strings detailing the candidate's strongest points based on the transcript and metrics.
- "top_improvements": A list of up to 5 strings detailing areas where the candidate struggled or fell short.
- "cross_section_insights": A list of up to 5 strings noting any patterns (e.g. "Struggled with system design but excelled in coding", or "Showed nervous sentiment during DSA").

Format your output strictly as JSON. No markdown formatting like ```json.
"""

def generate_agentic_report_summary(
    transcript_text: str,
    sentiment_summary: dict,
    proctoring_summary: dict,
    phase_scores: dict
) -> dict:
    llm = create_llm(api_key=os.getenv("GOOGLE_API_KEY", ""))
    
    prompt = f"""
CANDIDATE DATA:
Phase Scores Summary: {json.dumps(phase_scores)}
Behavioral Sentiment Summary: {json.dumps(sentiment_summary)}
Proctoring Summary: {json.dumps(proctoring_summary)}

TRANSCRIPT:
{transcript_text[:15000]}

Generate the hiring analysis JSON now.
"""
    try:
        response = llm.invoke([
            SystemMessage(content=_SYSTEM_PROMPT),
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
            "cross_section_insights": data.get("cross_section_insights", [])
        }
    except Exception as e:
        log.error(f"Report agent failed: {e}")
        return {}
