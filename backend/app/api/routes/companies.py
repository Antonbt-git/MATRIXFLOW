"""§9.1: companies.py — endpoints de empresas."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import EmpresaCreate, EmpresaResponse, EmpresaUpdate
from app.services.business_service import BusinessService
from app.repositories import BusinessRepository
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Empresa

router = APIRouter(prefix="/api/v1/companies", tags=["Companies"])

@router.post("/", response_model=EmpresaResponse)
def create_empresa(data: EmpresaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo los administradores pueden crear empresas")
    return BusinessService.create_empresa(db, data.nombre, data.nit, data.sector)

@router.get("/", response_model=List[EmpresaResponse])
def list_empresas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return BusinessRepository.list_empresas(db)


@router.put("/{empresa_id}", response_model=EmpresaResponse)
def update_empresa(empresa_id: int, data: EmpresaUpdate, db: Session = Depends(get_db),
                   current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        return BusinessService._update(db, Empresa, empresa_id, data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{empresa_id}")
def delete_empresa(empresa_id: int, db: Session = Depends(get_db),
                   current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        BusinessService._delete(db, Empresa, empresa_id)
        return {"ok": True, "id": empresa_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
