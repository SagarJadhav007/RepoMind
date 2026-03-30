async def run_brain(req):
    payload = await route_task(req)

    has_context = bool(payload["context"].strip())

    prompt = f"""
{payload['instruction']}

{payload['context']}

Return valid JSON only in this format:
{{
  "answer": "...",
  "sources": [],
  "confidence": "{'high' if has_context else 'low'}"
}}
"""

    raw = llm.generate(prompt)

    try:
        return json.loads(raw)
    except Exception:
        return {
            "answer": raw,
            "confidence": "low",
            "sources": []
        }
