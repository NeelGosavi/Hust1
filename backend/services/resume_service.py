"""Résumé parsing.

Extracts text from an uploaded PDF résumé using pypdf (a lightweight, pure-Python
PDF reader). Works for normal text-based PDFs; scanned/image-only PDFs have no
text layer and will raise a ValueError the caller can surface as a 400.
"""

import io
import logging
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def parse_resume_pdf(file_content: bytes) -> str:
    """Return the extracted text of a PDF résumé.

    Raises:
        ValueError: if the bytes are not a readable PDF, or if no text can be
            extracted (e.g. a scanned image with no text layer).
    """
    if not file_content:
        raise ValueError("The uploaded file is empty.")

    try:
        reader = PdfReader(io.BytesIO(file_content))
    except Exception as e:
        logger.warning(f"Could not read PDF: {e}")
        raise ValueError("Could not read the file. Please upload a valid PDF.")

    parts = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception as e:
            logger.warning(f"Failed to extract text from a page: {e}")
            text = ""
        if text.strip():
            parts.append(text.strip())

    full_text = "\n\n".join(parts).strip()
    if not full_text:
        raise ValueError(
            "No text could be extracted from this PDF. It may be a scanned "
            "image — please upload a text-based PDF."
        )
    return full_text
