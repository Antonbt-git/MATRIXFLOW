"""§9.1: products.py — endpoints de productos y categorías."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.schemas.business_schemas import (
    ProductoCreate, ProductoResponse, CategoriaCreate, CategoriaResponse, ProductoUpdate
)
from app.services.business_service import BusinessService
from app.repositories import BusinessRepository
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, Producto

router = APIRouter(prefix="/api/v1/products", tags=["Products"])

@router.post("/", response_model=ProductoResponse)
def create_producto(data: ProductoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo los administradores pueden crear productos")
    return BusinessService.create_producto(db, data.nombre, data.categoria_id, data.precio_base, data.sku)

@router.get("/", response_model=List[ProductoResponse])
def list_productos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return BusinessRepository.list_productos(db)

@router.post("/categories/", response_model=CategoriaResponse)
def create_categoria(data: CategoriaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo los administradores pueden crear categorías")
    return BusinessService.create_categoria(db, data.nombre)


@router.put("/{producto_id}", response_model=ProductoResponse)
def update_producto(producto_id: int, data: ProductoUpdate, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        return BusinessService._update(db, Producto, producto_id, data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{producto_id}")
def delete_producto(producto_id: int, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != 'admin':
        raise HTTPException(status_code=403, detail="Solo administradores")
    try:
        BusinessService._delete(db, Producto, producto_id)
        return {"ok": True, "id": producto_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
