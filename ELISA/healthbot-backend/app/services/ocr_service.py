import pytesseract
from pdf2image import convert_from_path

def extract_pdf_text(pdf_path: str) -> str:
    """Extract text from a PDF using OCR (supports scanned PDFs)."""

    try:
        pages = convert_from_path(pdf_path, dpi=250)

        full_text = ""

        for page in pages:
            text = pytesseract.image_to_string(page, lang="eng")
            full_text += text + "\n"

        cleaned = full_text.strip()
        return cleaned if cleaned else "OCR returned no usable text."

    except Exception as e:
        return f"OCR failed: {str(e)}"
