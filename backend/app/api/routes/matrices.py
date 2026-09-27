from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import MatrizCreate, MatrizResponse, MatrizUpdate
from app.services.business_service import BusinessService
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, MatrizDato, MatrixValue

router = APIRouter(prefix="/api/v1/matrices", tags=["Matrices"])


def _to_response(m: MatrizDato) -> MatrizResponse:
    return MatrizResponse(id=m.id, nombre_matriz=m.nombre_matriz, valores=m.valores,
                          dimensiones=m.dimensiones)


@router.post("/", response_model=MatrizResponse)
def create_matriz(data: MatrizCreate, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    m = BusinessService.create_matriz(db, data.nombre, data.valores, data.dimensiones)
    return _to_response(m)


@router.get("/", response_model=List[MatrizResponse])
def list_matrices(db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    return [_to_response(m) for m in BusinessService.list_matrices(db)]


@router.put("/{matriz_id}", response_model=MatrizResponse)
def update_matriz(matriz_id: int, data: MatrizUpdate, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    payload = data.model_dump()
    if payload.get("nombre") is not None:
        payload["nombre_matriz"] = payload.pop("nombre")
    try:
        m = BusinessService._update(db, MatrizDato, matriz_id, payload)
        if payload.get("valores") is not None:
            db.query(MatrixValue).filter(MatrixValue.matriz_id == matriz_id).delete()
            for fila, row in enumerate(payload["valores"]):
                for col, val in enumerate(row):
                    db.add(MatrixValue(matriz_id=matriz_id, fila=fila, columna=col, valor=float(val)))
            if payload.get("dimensiones") is None:
                m.dimensiones = f"{len(payload['valores'])}x{len(payload['valores'][0])}"
            db.commit()
            m = db.get(MatrizDato, matriz_id)
        return _to_response(m)
    except (ValueError, IndexError, TypeError) as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{matriz_id}")
def delete_matriz(matriz_id: int, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    try:
        db.query(MatrixValue).filter(MatrixValue.matriz_id == matriz_id).delete()
        db.commit()
        BusinessService._delete(db, MatrizDato, matriz_id)
        return {"ok": True, "id": matriz_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
