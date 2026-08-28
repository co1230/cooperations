from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import category as category_crud
from crud import operation_log as log_crud
from models.user import User
from models.category import Category
from schemas.category import CategoryCreateRequest, CategoryUpdateRequest
from utils.auth import get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response

router = APIRouter(prefix="/api/category", tags=["类目管理"])


@router.get("/list")
async def get_category_tree(
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 返回树形结构的类目列表
    categories = await category_crud.get_all_categories(db)
    tree = category_crud.build_category_tree(categories)
    return success_response(message="获取类目列表成功", data=tree)


@router.post("/create")
async def create_category(
        category_data: CategoryCreateRequest,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 创建逻辑：校验父级 -> 计算层级 -> 查重 -> 创建 -> 记录日志
    level = 1
    if category_data.parent_id != 0:
        parent = await category_crud.get_category_by_id(db, category_data.parent_id)
        if not parent:
            raise BizException("父级类目不存在")
        level = parent.level + 1
    if level > 3:
        raise BizException("类目最多支持三级")
    exists = await category_crud.get_category_by_name_and_parent(
        db, category_data.name, category_data.parent_id
    )
    if exists:
        raise BizException("同级下已存在同名类目")
    category = await category_crud.create_category(
        db, category_data.parent_id, category_data.name, level,
        category_data.sort, category_data.status
    )
    await log_crud.create_log(
        db, admin.id, admin.username, "新增类目",
        target_type="category", target_id=category.id,
        detail=f"新增类目：{category_data.name}", ip=get_client_ip(request)
    )
    return success_response(message="新增类目成功")


@router.put("/update/{category_id}")
async def update_category(
        category_id: int,
        category_data: CategoryUpdateRequest,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 修改逻辑：校验存在 -> 查重 -> 更新传入字段 -> 记录日志
    category = await category_crud.get_category_by_id(db, category_id)
    if not category:
        raise BizException("类目不存在")
    update_dict = category_data.model_dump(exclude_unset=True)
    if "name" in update_dict:
        exists = await category_crud.get_category_by_name_and_parent(
            db, update_dict["name"], category.parent_id
        )
        if exists and exists.id != category_id:
            raise BizException("同级下已存在同名类目")
    for field, value in update_dict.items():
        setattr(category, field, value)
    await log_crud.create_log(
        db, admin.id, admin.username, "修改类目",
        target_type="category", target_id=category.id,
        detail=f"修改类目：{category.name}", ip=get_client_ip(request)
    )
    return success_response(message="修改类目成功")


@router.delete("/delete/{category_id}")
async def delete_category(
        category_id: int,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 删除逻辑：校验存在 -> 校验无子类目 -> 删除 -> 记录日志
    category = await category_crud.get_category_by_id(db, category_id)
    if not category:
        raise BizException("类目不存在")
    result = await db.execute(select(Category).where(Category.parent_id == category_id))
    if result.scalars().first():
        raise BizException("该类目下存在子类目，无法删除")
    name = category.name
    await db.delete(category)
    await log_crud.create_log(
        db, admin.id, admin.username, "删除类目",
        target_type="category", target_id=category_id,
        detail=f"删除类目：{name}", ip=get_client_ip(request)
    )
    return success_response(message="删除类目成功")
