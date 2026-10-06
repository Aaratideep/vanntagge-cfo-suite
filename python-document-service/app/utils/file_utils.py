import os
import requests
import tempfile
import urllib.parse
from fastapi import HTTPException

def download_file_from_url(url: str, suffix: str = "") -> str:
    """
    Downloads a file from a public or signed URL to a temporary file.
    Returns the absolute path to the temporary file.
    """
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return temp_path
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download file: {str(e)}")

def cleanup_file(path: str):
    """
    Deletes the temporary file.
    """
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Warning: Failed to clean up temp file {path}: {e}")
