"""Fase 4: operaciones directas RF-10/11/12 con historial (CA-07, CA-08)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import numpy as np
from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.models.business_models import Usuario, MathOperationLog
from app.schemas.business_schemas import (
    OperationVectorRequest, OperationMatrixRequest,
    OperationResultResponse, OperationLogResponse,
)
from app.services.math_engine import MathEngine

router = APIRouter(prefix="/api/v1/operations", tags=["Operations"])

ALLOWED_VECTOR_OPS = {"sum", "subtract", "dot", "scalar", "linear_combination", "distance"}
ALLOWED_MATRIX_OPS = {"add", "subtract", "multiply", "transpose", "scalar"}


def _log(db: Session, operacion: str, a, b, res, user_id: int, estado: str = "OK"):
    log = MathOperationLog(operacion=operacion, entrada_a=a, entrada_b=b,
                           resultado=res, usuario_id=user_id, estado=estado)
    db.add(log)
    db.flush()
    # operation_inputs / operation_results (§10)
    from app.models.business_models import OperationInput, OperationResult
    for k, v in (a or {}).items():
        if v is not None:
            db.add(OperationInput(operacion_id=log.id, nombre=k, valor=v))
    db.add(OperationResult(operacion_id=log.id, valor=res, formato="json"))
    db.commit()
    return res


@router.post("/vectors/{op}", response_model=OperationResultResponse)
def operate_vectors(op: str, data: OperationVectorRequest, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Solo admin/analista")
    if op not in ALLOWED_VECTOR_OPS:
        raise HTTPException(status_code=400, detail=f"Op no soportada. Use: {sorted(ALLOWED_VECTOR_OPS)}")
    try:
        if op in ("sum", "subtract", "dot", "distance"):
            if data.v1 is None or data.v2 is None:
                raise ValueError("v1 y v2 requeridos")
            v1, v2 = np.array(data.v1), np.array(data.v2)
            fn = {"sum": MathEngine.sum_vectors, "subtract": MathEngine.subtract_vectors,
                  "dot": MathEngine.dot_product, "distance": MathEngine.calculate_euclidean_distance}[op]
            res = fn(v1, v2)
        elif op == "scalar":
            if data.v1 is None or data.scalar is None:
                raise ValueError("v1 y scalar requeridos")
            res = MathEngine.scalar_multiply(np.array(data.v1), data.scalar)
        elif op == "linear_combination":
            if not data.vectors or not data.weights:
                raise ValueError("vectors y weights requeridos")
            vecs = [np.array(v) for v in data.vectors]
            res = MathEngine.linear_combination(vecs, data.weights)
        out = res.tolist() if isinstance(res, np.ndarray) else res
        _log(db, f"vector_{op}", data.model_dump(), None, out, current_user.id)
        return {"operacion": f"vector_{op}", "resultado": out}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/matrices/{op}", response_model=OperationResultResponse)
def operate_matrices(op: str, data: OperationMatrixRequest, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("admin", "analista"):
        raise HTTPException(status_code=403, detail="Solo admin/analista")
    if op not in ALLOWED_MATRIX_OPS:
        raise HTTPException(status_code=400, detail=f"Op no soportada. Use: {sorted(ALLOWED_MATRIX_OPS)}")
    try:
        m1 = np.array(data.m1)
        if op in ("add", "subtract", "multiply"):
            if data.m2 is None:
                raise ValueError("m2 requerida")
            m2 = np.array(data.m2)
            fn = {"add": MathEngine.sum_vectors, "subtract": MathEngine.subtract_vectors,
                  "multiply": MathEngine.matrix_multiply}[op]
            res = fn(m1, m2)
        elif op == "transpose":
            res = MathEngine.transpose_matrix(m1)
        elif op == "scalar":
            if data.scalar is None:
                raise ValueError("scalar requerido")
            res = np.multiply(m1, data.scalar)
        out = res.tolist() if isinstance(res, np.ndarray) else res
        _log(db, f"matrix_{op}", data.model_dump(), None, out, current_user.id)
        return {"operacion": f"matrix_{op}", "resultado": out}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history", response_model=List[OperationLogResponse])
def history(limit: int = 50, db: Session = Depends(get_db),
            current_user: Usuario = Depends(get_current_user)):
    return db.query(MathOperationLog).order_by(MathOperationLog.id.desc()).limit(limit).all()
