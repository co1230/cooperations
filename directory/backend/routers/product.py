from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import product as product_crud
from schemas.product import ProductCreate, ProductUpdate


router = APIRouter(
    prefix="/api/product",
    tags=["商品管理"]
)


# =====================================================
# 商品列表
# GET /api/product/list
# =====================================================
@router.get("/list")
async def get_product_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    status: int | None = None,
    db: AsyncSession = Depends(get_db)
):

    result = await product_crud.get_product_list(
        db=db,
        page=page,
        page_size=page_size,
        keyword=keyword,
        category_id=category_id,
        brand_id=brand_id,
        status=status
    )

    return {
        "code": 200,
        "message": "获取商品列表成功",
        "data": result
    }



# =====================================================
# 新增商品
# POST /api/product/create
# =====================================================
@router.post("/create")
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db)
):

    result = await product_crud.create_product(
        db,
        product
    )

    return {
        "code": 200,
        "message": "商品创建成功",
        "data": result
    }



# =====================================================
# 修改商品
# PUT /api/product/update/{product_id}
# =====================================================
@router.put("/update/{product_id}")
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: AsyncSession = Depends(get_db)
):

    result = await product_crud.update_product(
        db,
        product_id,
        product
    )

    return {
        "code": 200,
        "message": "商品修改成功",
        "data": result
    }



# =====================================================
# 删除商品
# DELETE /api/product/delete/{product_id}
# =====================================================
@router.delete("/delete/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):

    result = await product_crud.delete_product(
        db,
        product_id
    )

    return {
        "code": 200,
        "message": "商品删除成功",
        "data": result
    }



# =====================================================
# 修改商品状态
# PUT /api/product/status/{product_id}
# =====================================================
@router.put("/status/{product_id}")
async def update_product_status(
    product_id: int,
    status: int,
    db: AsyncSession = Depends(get_db)
):

    result = await product_crud.update_product_status(
        db,
        product_id,
        status
    )

    return {
        "code": 200,
        "message": "商品状态修改成功",
        "data": result
    }
