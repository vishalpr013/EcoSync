"""
Helper utilities: Pagination calculation, email mocks, and calculations.
"""
from typing import Dict, Any

def get_pagination_metadata(total_items: int, page: int, page_size: int) -> Dict[str, Any]:
    """Calculate standard total pages and offsets for frontend data lists."""
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
    return {
        "total": total_items,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

async def send_mock_email(to_email: str, subject: str, body: str):
    """
    Mock email sender utility. Prints or logs email content.
    Used for policy acknowledgement reminders and critical compliance notices.
    """
    import logging
    logger = logging.getLogger("ecosync.email")
    logger.info(f"--- MOCK EMAIL SENT ---")
    logger.info(f"To: {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    logger.info(f"-----------------------")
    return True
