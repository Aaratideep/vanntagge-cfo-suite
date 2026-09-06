import pandas as pd
from app.processors.base_processor import BaseProcessor
from app.models.processing_result import ProcessingResult, DocumentMetadata

class CSVProcessor(BaseProcessor):
    def process(self, file_path: str, document_id: str, document_type: str, file_name: str, file_size: int) -> ProcessingResult:
        try:
            # Try to read the CSV, handling encoding safely
            try:
                df = pd.read_csv(file_path, nrows=1000) # Read max 1000 rows for processing sample
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding='latin1', nrows=1000)
            
            row_count = len(df.index)
            # Find total length without loading whole file if large
            total_rows = sum(1 for _ in open(file_path, 'rb')) - 1
            if total_rows < 0: total_rows = 0

            headers = df.columns.tolist()
            sample_data = df.head(5).fillna("").astype(str).values.tolist()

            return ProcessingResult(
                documentId=document_id,
                documentType=document_type,
                processor="csv",
                status="COMPLETED",
                metadata=DocumentMetadata(
                    fileName=file_name,
                    fileSizeBytes=file_size,
                    rowCount=total_rows
                ),
                tables=[{
                    "sheetName": "CSV Data",
                    "rows": total_rows,
                    "columns": len(headers),
                    "headers": headers,
                    "sample": sample_data
                }]
            )
        except Exception as e:
            return ProcessingResult(
                documentId=document_id,
                documentType=document_type,
                processor="csv",
                status="FAILED",
                metadata=DocumentMetadata(
                    fileName=file_name,
                    fileSizeBytes=file_size
                ),
                errorMessage=str(e)
            )
