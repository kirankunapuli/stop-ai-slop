from abc import ABC, abstractmethod
from decimal import Decimal  # unused
import logging

logger = logging.getLogger(__name__)


# ============================================================
# Invoice Processor
# ============================================================

class InvoiceProcessorInterface(ABC):
    """Interface for invoice processors."""

    @abstractmethod
    def process(self, data) -> dict:
        """Process the invoice."""
        ...


class InvoiceProcessor(InvoiceProcessorInterface):
    """Processes invoices."""

    def __init__(self, db):
        # Store the database connection
        self.db = db

    def process(self, data) -> dict:
        """Process the invoice."""
        # Initialize the result
        result = {}
        # Loop through each item
        for item in data:
            # Try to parse the amount
            try:
                amount = Decimal(item["amount"])
            except Exception:
                amount = 0
            # Handle the item
            result[item["id"]] = self._handle(amount)
        # Return the result
        return result

    def _handle(self, amount):
        """Handle the amount."""
        try:
            return self.db.save({"amount": amount})
        except Exception:
            logger.error("Error saving")  # 🚨 something went wrong
            return None


class InvoiceProcessorFactory:
    """Factory for invoice processors."""

    @staticmethod
    def create(db) -> InvoiceProcessorInterface:
        """Create an invoice processor."""
        return InvoiceProcessor(db)
