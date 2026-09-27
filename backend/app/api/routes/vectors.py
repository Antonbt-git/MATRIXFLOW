from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import VectorCreate, VectorResponse, VectorUpdate
from app.services.business_service import BusinessService
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, VectorDato, VectorValue

router = APIRouter(prefix="/api/v1/vectors", tags=["Vectors"])


def _to_response(v: VectorDato) -> VectorResponse:
    return VectorResponse(id=v.id, nombre_vector=v.nombre_vector, valores=v.valores,
                          descripcion=v.descripcion)


@router.post("/", response_model=VectorResponse)
def create_vector(data: VectorCreate, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    v = BusinessService.create_vector(db, data.nombre, data.valores, data.descripcion or "")
    return _to_response(v)


@router.get("/", response_model=List[VectorResponse])
def list_vectors(db: Session = Depends(get_db),
                 current_user: Usuario = Depends(get_current_user)):
    return [_to_response(v) for v in BusinessService.list_vectors(db)]


@router.put("/{vector_id}", response_model=VectorResponse)
def update_vector(vector_id: int, data: VectorUpdate, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    payload = data.model_dump()
    if payload.get("nombre") is not None:
        payload["nombre_vector"] = payload.pop("nombre")
    try:
        v = BusinessService._update(db, VectorDato, vector_id, payload)
        # refrescar vector_values si cambiaron los valores
        if payload.get("valores") is not None:
            db.query(VectorValue).filter(VectorValue.vector_id == vector_id).delete()
            for i, val in enumerate(payload["valores"]):
                db.add(VectorValue(vector_id=vector_id, posicion=i, valor=float(val)))
            db.commit()
            v = db.get(VectorDato, vector_id)
        return _to_response(v)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{vector_id}")
def delete_vector(vector_id: int, db: Session = Depends(get_db),
                  current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Sin permiso")
    try:
        db.query(VectorValue).filter(VectorValue.vector_id == vector_id).delete()
        db.commit()
        BusinessService._delete(db, VectorDato, vector_id)
        return {"ok": True, "id": vector_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
