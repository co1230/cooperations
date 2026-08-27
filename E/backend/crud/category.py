from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.category import Category


async def get_all_categories(db: AsyncSession) -> List[Category]:
    """获取全部类目（按排序值升序）"""
    result = await db.execute(
        select(Category).order_by(Category.sort.asc(), Category.id.asc())
    )
    return list(result.scalars().all())


async def get_category_by_id(db: AsyncSession, category_id: int) -> Optional[Category]:
    """根据ID查询类目"""
    return await db.get(Category, category_id)


async def get_category_by_name_and_parent(db: AsyncSession, name: str, parent_id: int) -> Optional[Category]:
    """查询同级下是否已存在同名类目"""
    result = await db.execute(
        select(Category).where(Category.name == name, Category.parent_id == parent_id)
    )
    return result.scalars().first()


async def create_category(
        db: AsyncSession, parent_id: int, name: str, level: int, sort: int, status: int
) -> Category:
    """创建类目"""
    category = Category(parent_id=parent_id, name=name, level=level, sort=sort, status=status)
    db.add(category)
    await db.flush()
    return category


def build_category_tree(categories: List[Category]) -> List[dict]:
    """将类目列表组装成树形结构（children 嵌套）"""

    def build(parent_id: int) -> List[dict]:
        nodes = []
        for c in categories:
            if c.parent_id == parent_id:
                nodes.append({
                    "id": c.id,
                    "parent_id": c.parent_id,
                    "name": c.name,
                    "level": c.level,
                    "sort": c.sort,
                    "status": c.status,
                    "created_at": c.created_at,
                    "children": build(c.id)
                })
        return nodes

    return build(0)
