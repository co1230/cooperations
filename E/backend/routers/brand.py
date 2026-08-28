from typing import Optional

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import brand as brand_crud
from crud import operation_log as log_crud
from models.user import User
from schemas.brand import BrandCreateRequest, BrandResponse, BrandUpdateRequest
from utils.auth import get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response

router = APIRouter(prefix="/api/brand", tags=["品牌管理"])


@router.get("/list")
async def get_brand_list(
        page: int = 1,
        page_size: int = 10,
        keyword: Optional[str] = None,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, brands = await brand_crud.get_brand_list(db, keyword, page, page_size)
    list_data = [BrandResponse.model_validate(b) for b in brands]
    return success_response(message="获取品牌列表成功", data={"total": total, "list": list_data})


@router.post("/create")
async def create_brand(
        brand_data: BrandCreateRequest,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 创建逻辑：查重 -> 创建 -> 记录日志
    exists = await brand_crud.get_brand_by_name(db, brand_data.name)
    if exists:
        raise BizException("品牌名称已存在")
    brand = await brand_crud.create_brand(db, brand_data)
    await log_crud.create_log(
        db, admin.id, admin.username, "新增品牌",
        target_type="brand", target_id=brand.id,
        detail=f"新增品牌：{brand.name}", ip=get_client_ip(request)
    )
    return success_response(message="新增品牌成功")


@router.put("/update/{brand_id}")
async def update_brand(
        brand_id: int,
        brand_data: BrandUpdateRequest,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 修改逻辑：校验存在 -> 查重 -> 更新传入字段 -> 记录日志
    brand = await brand_crud.get_brand_by_id(db, brand_id)
    if not brand:
        raise BizException("品牌不存在")
    update_dict = brand_data.model_dump(exclude_unset=True)
    if "name" in update_dict and update_dict["name"] != brand.name:
        exists = await brand_crud.get_brand_by_name(db, update_dict["name"])
        if exists:
            raise BizException("品牌名称已存在")
    await brand_crud.update_brand(db, brand, update_dict)
    await log_crud.create_log(
        db, admin.id, admin.username, "修改品牌",
        target_type="brand", target_id=brand.id,
        detail=f"修改品牌：{brand.name}", ip=get_client_ip(request)
    )
    return success_response(message="修改品牌成功")


@router.delete("/delete/{brand_id}")
async def delete_brand(
        brand_id: int,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 删除逻辑：校验存在 -> 删除 -> 记录日志
    brand = await brand_crud.get_brand_by_id(db, brand_id)
    if not brand:
        raise BizException("品牌不存在")
    name = brand.name
    await brand_crud.delete_brand(db, brand)
    await log_crud.create_log(
        db, admin.id, admin.username, "删除品牌",
        target_type="brand", target_id=brand_id,
        detail=f"删除品牌：{name}", ip=get_client_ip(request)
    )
    return success_response(message="删除品牌成功")
