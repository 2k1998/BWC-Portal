# routers/companies.py
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from .auth import get_current_user
from .utils import check_roles

router = APIRouter(prefix="/companies", tags=["companies"])

@router.post("/", response_model=schemas.CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    company: schemas.CompanyCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    check_roles(current_user, ["admin"])

    # --- MODIFIED: Only check for VAT uniqueness if it's provided ---
    if company.vat_number:
        db_company_vat = db.query(models.Company).filter(models.Company.vat_number == company.vat_number).first()
        if db_company_vat:
            raise HTTPException(status_code=400, detail="A company with this VAT number already exists.")
    
    db_company_name = db.query(models.Company).filter(models.Company.name == company.name).first()
    if db_company_name:
        raise HTTPException(status_code=400, detail="A company with this name already exists.")

    new_company = models.Company(**company.dict())
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

# ... (The rest of the file: list_companies, get_company, delete_company, etc. remains the same) ...

@router.get("/", response_model=List[schemas.CompanyOut])
def list_companies(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns a list of all companies.
    """
    return db.query(models.Company).all()

@router.get("/{company_id}", response_model=schemas.CompanyOut)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns details of a specific company.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes a company after unlinking any associated tasks.
    """
    check_roles(current_user, ["admin"])
    
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    db.query(models.Task).filter(models.Task.company_id == company_id).update({"company_id": None})
    db.commit()
    
    db.delete(company)
    db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)