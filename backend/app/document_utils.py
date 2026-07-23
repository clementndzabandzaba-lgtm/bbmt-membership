from fastapi import HTTPException, UploadFile

ALLOWED_DOC_TYPES = {"id_copy", "birth_certificate", "death_certificate", "other"}
MAX_DOCUMENT_SIZE = 5 * 1024 * 1024  # 5MB
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


def validate_document_upload(doc_type: str, file: UploadFile, contents: bytes) -> None:
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Invalid document type")
    if len(contents) > MAX_DOCUMENT_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    if file.content_type != "image/png" or not contents.startswith(PNG_MAGIC):
        raise HTTPException(status_code=400, detail="Only PNG files are accepted")
