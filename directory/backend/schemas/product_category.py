from pydantic import BaseModel, Field
from datetime import datetime


# ===============================
# 商品分类基础字段
# ===============================

class ProductCategoryBase(BaseModel):

    name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="商品分类名称"
    )

    parent_id: int = Field(
        default=0,
        description="父级分类ID，0表示一级分类"
    )

    sort: int = Field(
        default=0,
        description="排序值，越小越靠前"
    )

    status: int = Field(
        default=1,
        description="状态：1启用 0禁用"
    )



# ===============================
# 新增商品分类
# POST
# ===============================

class ProductCategoryCreate(ProductCategoryBase):
    """
    创建商品分类请求参数
    """
    pass



# ===============================
# 修改商品分类
# PUT
# ===============================

class ProductCategoryUpdate(BaseModel):
    """
    修改商品分类
    只更新传入字段
    """

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=50
    )

    parent_id: int | None = None

    sort: int | None = None

    status: int | None = None



# ===============================
# 返回数据
# ===============================

class ProductCategoryResponse(ProductCategoryBase):

    id: int

    created_at: datetime

    updated_at: datetime


    class Config:
        from_attributes = True
