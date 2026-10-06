import pytesseract
from PIL import Image
from app.processors.base_processor import BaseProcessor
from app.models.processing_result import ProcessingResult, DocumentMetadata

class ImageProcessor(BaseProcessor):
    def process(self, file_path: str, document_id: str, document_type: str, file_name: str, file_size: int) -> ProcessingResult:
        try:
            img = Image.open(file_path)
            width, height = img.size
            
            # Extract text using OCR
            extracted_text = pytesseract.image_to_string(img)
            
            return ProcessingResult(
                documentId=document_id,
                documentType=document_type,
                processor="image",
                status="COMPLETED",
                metadata=DocumentMetadata(
                    fileName=file_name,
                    fileSizeBytes=file_size,
                    pageCount=1
                ),
                extractedText=extracted_text[:50000]
            )
        except Exception as e:
            return ProcessingResult(
                documentId=document_id,
                documentType=document_type,
                processor="image",
                status="FAILED",
                metadata=DocumentMetadata(
                    fileName=file_name,
                    fileSizeBytes=file_size
                ),
                errorMessage=str(e)
            )
