from fastapi import HTTPException, UploadFile

ALLOWED_DOC_TYPES = {"id_copy", "birth_certificate", "death_certificate", "power_of_attorney", "other"}
MAX_DOCUMENT_SIZE = 5 * 1024 * 1024  # 5MB

# Maps the declared content-type to the magic bytes its file signature must start
# with — we don't trust the client's claimed content-type alone, especially on the
# unauthenticated public upload endpoint.
ALLOWED_SIGNATURES = {
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/jpeg": b"\xff\xd8\xff",
    "application/pdf": b"%PDF-",
}


def validate_document_upload(doc_type: str, file: UploadFile, contents: bytes) -> None:
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Invalid document type")
    if len(contents) > MAX_DOCUMENT_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    signature = ALLOWED_SIGNATURES.get(file.content_type)
    if signature is None or not contents.startswith(signature):
        raise HTTPException(status_code=400, detail="Only PNG, JPEG, or PDF files are accepted")
