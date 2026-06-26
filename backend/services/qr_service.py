# backend/services/qr_service.py

import qrcode
import io
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def generate_qr_code_base64(url: str) -> str:
    """
    Generate a QR code as a base64 encoded string
    
    Args:
        url (str): The URL to encode in the QR code
        
    Returns:
        str: Base64 encoded image data with data URI prefix, or empty string on error
    """
    if not url:
        logger.warning("No URL provided for QR code generation")
        return ""
    
    try:
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Generate image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # Return as data URI
        return f"data:image/png;base64,{img_str}"
        
    except Exception as e:
        logger.error(f"Error generating QR code: {e}")
        return ""

def generate_qr_code_bytes(url: str) -> Optional[bytes]:
    """
    Generate a QR code and return as bytes
    
    Args:
        url (str): The URL to encode in the QR code
        
    Returns:
        Optional[bytes]: QR code image as bytes, or None on error
    """
    if not url:
        return None
    
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return buffered.getvalue()
        
    except Exception as e:
        logger.error(f"Error generating QR code bytes: {e}")
        return None