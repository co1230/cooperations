from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.brand import Brand
from schemas.brand import BrandCreateRequest


async def get_brand_by_id(db: AsyncSession, brand_id: int) -> Optional[Brand]:
    """根据ID查询品牌"""
    return await db.get(Brand, brand_id)


async def get_brand_by_name(db: AsyncSession, name: str) -> Optional[Brand]:
    """根据名称查询品牌"""
    result = await db.execute(select(Brand).where(Brand.name == name))
    return result.scalars().first()


async def get_brand_list(
        db: AsyncSession, keyword: Optional[str], page: int, page_size: int
) -> Tuple[int, List[Brand]]:
    """分页查询品牌列表，支持按名称模糊搜索"""
    filters = []
    if keyword:
        filters.append(Brand.name.like(f"%{keyword}%"))
    total = await db.scalar(select(func.count()).select_from(Brand).where(*filters))
    result = await db.execute(
        select(Brand).where(*filters)
        .order_by(Brand.created_at.desc(), Brand.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return total, list(result.scalars().all())


async def create_brand(db: AsyncSession, brand_data: BrandCreateRequest) -> Brand:
    """创建品牌"""
    brand = Brand(**brand_data.model_dump())
    db.add(brand)
    await db.flush()
    return brand


async def update_brand(db: AsyncSession, brand: Brand, update_dict: dict) -> Brand:
    """更新品牌"""
    for field, value in update_dict.items():
        setattr(brand, field, value)
    return brand


async def delete_brand(db: AsyncSession, brand: Brand) -> None:
    """删除品牌"""
    await db.delete(brand)
