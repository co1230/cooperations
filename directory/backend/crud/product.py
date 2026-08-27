from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.product import Product
from schemas.product import ProductCreate, ProductUpdate



# ===============================
# 新增商品
# ===============================

async def create_product(
        session: AsyncSession,
        data: ProductCreate
):
    product = Product(
        **data.model_dump()
    )

    session.add(product)

    await session.commit()

    await session.refresh(product)

    return product



# ===============================
# 商品列表查询
# ===============================

async def get_product_list(
        session: AsyncSession,
        page: int = 1,
        page_size: int = 10,
        keyword: Optional[str] = None,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        status: Optional[int] = None
):

    query = select(Product)


    # 商品名称搜索
    if keyword:
        query = query.where(
            Product.name.like(f"%{keyword}%")
        )


    # 类目筛选
    if category_id:
        query = query.where(
            Product.category_id == category_id
        )


    # 品牌筛选
    if brand_id:
        query = query.where(
            Product.brand_id == brand_id
        )


    # 状态筛选
    if status is not None:
        query = query.where(
            Product.status == status
        )


    # 总数量
    count_query = select(
        func.count()
    ).select_from(query.subquery())


    total_result = await session.execute(
        count_query
    )

    total = total_result.scalar()



    # 分页
    query = query.offset(
        (page - 1) * page_size
    ).limit(
        page_size
    )


    result = await session.execute(query)

    products = result.scalars().all()


    return total, products



# ===============================
# 根据ID查询商品
# ===============================

async def get_product_by_id(
        session: AsyncSession,
        product_id: int
):

    result = await session.execute(
        select(Product)
        .where(Product.id == product_id)
    )

    return result.scalar_one_or_none()



# ===============================
# 修改商品
# ===============================

async def update_product(
        session: AsyncSession,
        product: Product,
        data: ProductUpdate
):

    update_data = data.model_dump(
        exclude_unset=True
    )


    for key, value in update_data.items():

        setattr(
            product,
            key,
            value
        )


    await session.commit()

    await session.refresh(product)

    return product



# ===============================
# 删除商品
# ===============================

async def delete_product(
        session: AsyncSession,
        product: Product
):

    await session.delete(product)

    await session.commit()

    return True



# ===============================
# 修改库存
# ===============================

async def update_stock(
        session: AsyncSession,
        product: Product,
        stock: int
):

    product.stock = stock

    await session.commit()

    await session.refresh(product)

    return product



# ===============================
# 修改上下架状态
# ===============================

async def update_status(
        session: AsyncSession,
        product: Product,
        status: int
):

    product.status = status

    await session.commit()

    await session.refresh(product)

    return product
