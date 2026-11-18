from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.threat_intel import get_threat_intelligence

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def obtener_inteligencia_amenazas(
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Threat intelligence feed derived from reported IoCs."""
    return get_threat_intelligence(db=db, limit=limit)
