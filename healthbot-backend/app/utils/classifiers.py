def classify_document_type(text: str) -> str:
    """
    Simple heuristic stub. You can later replace with AI-based classification.
    """
    t = text.lower()
    if "discharge" in t or "admission" in t:
        return "discharge_summary"
    if "prescription" in t or "rx" in t:
        return "prescription"
    if "laboratory" in t or "hemoglobin" in t or "report" in t:
        return "lab_report"
    if "invoice" in t or "bill" in t or "amount" in t:
        return "bill"
    return "unknown"
