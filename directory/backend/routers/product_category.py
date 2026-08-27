from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import product_category as category_crud
from schemas.product_category import (
    ProductCategoryCreate,
    ProductCategoryUpdate
)


router = APIRouter(
    prefix="/api/product-category",
    tags=["商品分类管理"]
)


# =====================================================
# 商品分类列表
# GET /api/product-category/list
# =====================================================

@router.get("/list")
async def get_category_list(
    keyword: str | None = None,
    db: AsyncSession = Depends(get_db)
):

    result = await category_crud.get_category_list(
        db,
        keyword
    )

    return {
        "code": 200,
        "message": "获取商品分类列表成功",
        "data": result
    }



# =====================================================
# 新增商品分类
# POST /api/product-category/create
# =====================================================

@router.post("/create")
async def create_category(
    category: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db)
):

    result = await category_crud.create_category(
        db,
        category
    )

    return {
        "code": 200,
        "message": "商品分类创建成功",
        "data": result
    }



# =====================================================
# 修改商品分类
# PUT /api/product-category/update/{category_id}
# =====================================================

@router.put("/update/{category_id}")
async def update_category(
    category_id: int,
    category: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db)
):

    result = await category_crud.update_category(
        db,
        category_id,
        category
    )

    return {
        "code": 200,
        "message": "商品分类修改成功",
        "data": result
    }



# =====================================================
# 删除商品分类
# DELETE /api/product-category/delete/{category_id}
# =====================================================

@router.delete("/delete/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):

    result = await category_crud.delete_category(
        db,
        category_id
    )

    return {
        "code": 200,
        "message": "商品分类删除成功",
        "data": result
    }



# =====================================================
# 商品分类详情
# GET /api/product-category/detail/{category_id}
# =====================================================

@router.get("/detail/{category_id}")
async def category_detail(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):

    result = await category_crud.get_category_detail(
        db,
        category_id
    )

    return {
        "code": 200,
        "message": "获取商品分类详情成功",
        "data": result
    }
