from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.processing_result import ProcessingResult

class BaseProcessor(ABC):
    @abstractmethod
    def process(self, file_path: str, document_id: str, document_type: str, file_name: str, file_size: int) -> ProcessingResult:
        """
        Process the file and return a ProcessingResult.
        """
        pass
