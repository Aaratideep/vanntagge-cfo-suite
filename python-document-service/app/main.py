from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.utils.file_utils import download_file_from_url, cleanup_file
from app.processors.pdf_processor import PDFProcessor
from app.processors.excel_processor import ExcelProcessor
from app.processors.csv_processor import CSVProcessor
from app.processors.docx_processor import DocxProcessor
from app.processors.image_processor import ImageProcessor
from app.models.processing_result import ProcessingResult, DocumentMetadata
import os

app = FastAPI(title="Vinntagge Document Processing Service")

class ProcessRequest(BaseModel):
    documentId: str
    downloadUrl: str
    fileName: str
    fileExtension: str
    documentType: str
    fileSizeBytes: int

def get_processor(file_extension: str):
    ext = file_extension.lower().replace(".", "")
    if ext == "pdf":
        return PDFProcessor()
    elif ext in ["xlsx", "xls"]:
        return ExcelProcessor()
    elif ext == "csv":
        return CSVProcessor()
    elif ext == "docx":
        return DocxProcessor()
    elif ext in ["jpg", "jpeg", "png"]:
        return ImageProcessor()
    return None

@app.post("/api/process", response_model=ProcessingResult)
async def process_document(request: ProcessRequest, background_tasks: BackgroundTasks):
    processor = get_processor(request.fileExtension)
    if not processor:
        return ProcessingResult(
            documentId=request.documentId,
            documentType=request.documentType,
            processor="unknown",
            status="FAILED",
            metadata=DocumentMetadata(
                fileName=request.fileName,
                fileSizeBytes=request.fileSizeBytes
            ),
            errorMessage=f"Unsupported file type: {request.fileExtension}"
        )
    
    # Check file size limit (e.g., 50MB)
    if request.fileSizeBytes > 50 * 1024 * 1024:
        return ProcessingResult(
            documentId=request.documentId,
            documentType=request.documentType,
            processor="unknown",
            status="FAILED",
            metadata=DocumentMetadata(
                fileName=request.fileName,
                fileSizeBytes=request.fileSizeBytes
            ),
            errorMessage="File exceeds 50MB processing limit."
        )

    # Download file to temp storage
    try:
        temp_path = download_file_from_url(request.downloadUrl, suffix=f".{request.fileExtension}")
    except Exception as e:
        return ProcessingResult(
            documentId=request.documentId,
            documentType=request.documentType,
            processor="download",
            status="FAILED",
            metadata=DocumentMetadata(
                fileName=request.fileName,
                fileSizeBytes=request.fileSizeBytes
            ),
            errorMessage=str(e)
        )
    
    # Process the file
    try:
        result = processor.process(
            file_path=temp_path,
            document_id=request.documentId,
            document_type=request.documentType,
            file_name=request.fileName,
            file_size=request.fileSizeBytes
        )
    except Exception as e:
        result = ProcessingResult(
            documentId=request.documentId,
            documentType=request.documentType,
            processor="unknown",
            status="FAILED",
            metadata=DocumentMetadata(
                fileName=request.fileName,
                fileSizeBytes=request.fileSizeBytes
            ),
            errorMessage=f"Critical processing error: {str(e)}"
        )
    finally:
        # Schedule cleanup
        background_tasks.add_task(cleanup_file, temp_path)
    
    return result

@app.get("/health")
def health_check():
    return {"status": "healthy"}
