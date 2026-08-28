from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field



# =====================================================
# 商品基础字段
# =====================================================

class ProductBase(BaseModel):

    """
    商品公共字段
    """

    # 所属类目
    category_id: int = Field(
        ...,
        description="商品所属类目ID"
    )


    # 所属品牌
    brand_id: int = Field(
        ...,
        description="商品所属品牌ID"
    )


    # 商品名称
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="商品名称"
    )


    # 商品描述
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="商品描述"
    )


    # 商品价格
    price: float = Field(
        ...,
        gt=0,
        description="商品售价"
    )


    # 商品库存
    stock: int = Field(
        default=0,
        ge=0,
        description="商品库存数量"
    )


    # 商品图片
    image: Optional[str] = Field(
        default=None,
        max_length=255,
        description="商品图片URL"
    )


    # 商品状态
    # 1 上架
    # 0 下架
    status: int = Field(
        default=1,
        description="商品状态：1上架 0下架"
    )



# =====================================================
# 新增商品
# POST /api/product/create
# =====================================================

class ProductCreate(ProductBase):

    pass



# =====================================================
# 修改商品
# PUT /api/product/update/{id}
# =====================================================

class ProductUpdate(BaseModel):


    category_id: Optional[int] = Field(
        default=None,
        description="商品所属类目ID"
    )


    brand_id: Optional[int] = Field(
        default=None,
        description="商品所属品牌ID"
    )


    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="商品名称"
    )


    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="商品描述"
    )


    price: Optional[float] = Field(
        default=None,
        gt=0,
        description="商品售价"
    )


    stock: Optional[int] = Field(
        default=None,
        ge=0,
        description="商品库存数量"
    )


    image: Optional[str] = Field(
        default=None,
        max_length=255,
        description="商品图片URL"
    )


    status: Optional[int] = Field(
        default=None,
        description="商品状态：1上架 0下架"
    )



# =====================================================
# 商品返回数据
# GET /api/product/list
# =====================================================

class ProductResponse(ProductBase):


    id: int = Field(
        description="商品ID"
    )


    created_at: datetime = Field(
        description="创建时间"
    )


    updated_at: datetime = Field(
        description="更新时间"
    )


    class Config:

        from_attributes = True
