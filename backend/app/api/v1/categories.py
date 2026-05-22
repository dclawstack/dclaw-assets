import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.category_repo import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryRead

router = APIRouter()


@router.get("", response_model=list[CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    items, _ = await repo.list_all(limit=200)
    return items


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    existing = await repo.get_by_name(data.name)
    if existing:
        raise HTTPException(status_code=409, detail="Category name already exists")
    return await repo.create_category(data)


@router.get("/{category_id}", response_model=CategoryRead)
async def get_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    obj = await repo.get_by_id(category_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")
    return obj


@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = CategoryRepository(db)
    obj = await repo.get_by_id(category_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")
    return await repo.update_category(obj, data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    obj = await repo.get_by_id(category_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")
    await repo.delete(obj)
