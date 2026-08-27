from typing import Optional

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    """
    商品基础字段
    """

    category_id: int = Field(
        ...,
        description="商品所属类目ID"
    )

    brand_id: int = Field(
        ...,
        description="商品所属品牌ID"
    )

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="商品名称"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="商品描述"
    )

    price: float = Field(
        ...,
        gt=0,
        description="商品价格"
    )

    stock: int = Field(
        default=0,
        ge=0,
        description="商品库存"
    )

    image: Optional[str] = Field(
        default=None,
        max_length=255,
        description="商品图片URL"
    )

    status: int = Field(
        default=1,
        description="商品状态：1上架 0下架"
    )


# ============================
# 新增商品请求
# ============================

class ProductCreate(ProductBase):
    pass



# ============================
# 修改商品请求
# ============================

class ProductUpdate(BaseModel):

    category_id: Optional[int] = None

    brand_id: Optional[int] = None

    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    description: Optional[str] = None

    price: Optional[float] = Field(
        default=None,
        gt=0
    )

    stock: Optional[int] = Field(
        default=None,
        ge=0
    )

    image: Optional[str] = None

    status: Optional[int] = None



# ============================
# 商品返回数据
# ============================

class ProductResponse(ProductBase):

    id: int

    created_at: str

    updated_at: str


    class Config:
        from_attributes = True
