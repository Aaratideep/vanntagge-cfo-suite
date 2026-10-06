import fitz # PyMuPDF
import pytesseract
from PIL import Image
import io
from app.processors.base_processor import BaseProcessor
from app.models.processing_result import ProcessingResult, DocumentMetadata

class PDFProcessor(BaseProcessor):
    def process(self, file_path: str, document_id: str, document_type: str, file_name: str, file_size: int) -> ProcessingResult:
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            extracted_text = ""
            
            for page_num in range(min(page_count, 10)): # Limit to first 10 pages for safety
                page = doc.load_page(page_num)
                text = page.get_text()
                
                # If no text is found, try OCR on the page image
                if not text.strip():
                    pix = page.get_pixmap()
                    img = Image.open(io.BytesIO(pix.tobytes()))
                    text = pytesseract.image_to_string(img)
                
                extracted_text += f"\n--- Page {page_num + 1} ---\n{text}"
            
            doc.close()
            
            return ProcessingResult(
                documentId=document_id,
                documentType=document_type,
                processor="pdf",
                status="COMPLETED",
                metadata=DocumentMetadata(
                    fileName=file_name,
                    fileSizeBytes=file_size,
                    pageCount=page_count
                ),
                extractedText=extracted_text[:50000] # Limit extracted text size
            )
        except Exception as e:
            return ProcessingResult(
                documentId=document_id,
                documentType=document_type,
                processor="pdf",
                status="FAILED",
                metadata=DocumentMetadata(
                    fileName=file_name,
                    fileSizeBytes=file_size
                ),
                errorMessage=str(e)
            )
