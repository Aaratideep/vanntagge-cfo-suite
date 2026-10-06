from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class DocumentMetadata(BaseModel):
    fileName: str
    fileSizeBytes: int
    sheetCount: Optional[int] = None
    rowCount: Optional[int] = None
    pageCount: Optional[int] = None

class ProcessingResult(BaseModel):
    documentId: str
    documentType: str
    processor: str
    status: str = "COMPLETED"
    metadata: DocumentMetadata
    extractedText: Optional[str] = None
    tables: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    fields: Optional[Dict[str, Any]] = Field(default_factory=dict)
    confidence: Optional[float] = None
    errorMessage: Optional[str] = None
