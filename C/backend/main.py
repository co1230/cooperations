from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from bootstrap import initialize_database
from config import engine, get_db
from models import CartItem, Order, OrderItem, Product, ShoppingCart
from schemas import (
    AfterSaleInput, AuditInput, CartAdd, CartUpdate, CheckoutInput,
    CreateOrderInput, PayInput, SelectionUpdate, ShipInput,
)
from service import (
    add_cart, apply_after_sale, audit_after_sale, cancel_order, change_fulfillment,
    checkout_lines, create_orders, ensure_user, list_cart, list_orders,
    merchant_after_sales, merchant_orders, order_json, pay_orders, preview_json,
    ship_order,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await initialize_database()
    yield
    await engine.dispose()


app = FastAPI(title="C 交易流程服务", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8080", "http://127.0.0.1:8081", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ok(data=None, message="成功"):
    return {"code": 200, "message": message, "data": data}


async def buyer(
    db: AsyncSession = Depends(get_db),
    x_user_id: int = Header(default=10001),
    x_user_name: str = Header(default="演示用户"),
):
    # A 的本地账号从 1 开始，E 的管理员种子也使用 id=1。
    # 交易库使用独立买家命名空间，避免两端为同一主键争抢角色。
    buyer_id = 2_000_000_000 + x_user_id
    await ensure_user(db, buyer_id, x_user_name)
    return buyer_id


def merchant_identity(x_merchant_id: int | None = Header(default=None)):
    # 统一平台演示时为空，D 登录接入后应由 A/JWT 注入此头部。
    return x_merchant_id


@app.get("/api/health")
async def health():
    return ok({"service": "C", "status": "UP", "port": 8002})


@app.get("/api/cart/items")
async def cart_list(db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await list_cart(db, user_id))


@app.post("/api/cart/items")
async def cart_add(payload: CartAdd, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await add_cart(db, user_id, payload.source_product_id, payload.spec_labels, payload.quantity), "已加入购物车")


@app.patch("/api/cart/items/{item_id}")
async def cart_update(item_id: int, payload: CartUpdate, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    cart = await db.scalar(select(ShoppingCart).where(ShoppingCart.buyer_id == user_id))
    item = await db.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == (cart.id if cart else -1)))
    if not item:
        raise HTTPException(404, "购物车商品不存在")
    product = await db.get(Product, item.product_id)
    if payload.quantity is not None:
        if payload.quantity > product.stock:
            raise HTTPException(409, "库存不足")
        item.quantity = payload.quantity
    if payload.selected is not None:
        item.selected = payload.selected
    await db.flush()
    return ok((await list_cart(db, user_id)))


@app.delete("/api/cart/items/{item_id}")
async def cart_delete(item_id: int, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    cart = await db.scalar(select(ShoppingCart).where(ShoppingCart.buyer_id == user_id))
    if cart:
        await db.execute(delete(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    return ok(None, "已删除")


@app.put("/api/cart/selection")
async def cart_selection(payload: SelectionUpdate, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    cart = await db.scalar(select(ShoppingCart).where(ShoppingCart.buyer_id == user_id))
    if cart and payload.item_ids:
        rows = (await db.scalars(select(CartItem).where(CartItem.cart_id == cart.id, CartItem.id.in_(payload.item_ids)))).all()
        for item in rows:
            item.selected = payload.selected
    return ok(await list_cart(db, user_id))


@app.post("/api/checkout/preview")
async def checkout_preview(payload: CheckoutInput, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    lines = await checkout_lines(db, user_id, payload.mode, payload.buy_now)
    return ok(preview_json(lines))


@app.post("/api/orders")
async def order_create(payload: CreateOrderInput, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await create_orders(db, user_id, payload), "下单成功")


@app.get("/api/orders")
async def order_list(db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await list_orders(db, user_id))


@app.get("/api/orders/{order_id}")
async def order_detail(order_id: int, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.buyer_id == user_id))
    if not order:
        raise HTTPException(404, "订单不存在")
    items = (await db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))).all()
    return ok(order_json(order, items))


@app.post("/api/orders/{order_id}/cancel")
async def order_cancel(order_id: int, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await cancel_order(db, user_id, order_id), "订单已取消")


@app.post("/api/orders/{order_id}/confirm")
async def order_confirm(order_id: int, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await change_fulfillment(db, user_id, order_id, "confirm"), "已确认收货")


@app.post("/api/orders/{order_id}/after-sales")
async def after_sale_create(order_id: int, payload: AfterSaleInput, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await apply_after_sale(db, user_id, order_id, payload), "售后申请已提交")


@app.post("/api/payments/mock")
async def payment_mock(payload: PayInput, db: AsyncSession = Depends(get_db), user_id: int = Depends(buyer)):
    return ok(await pay_orders(db, user_id, payload), "支付成功")


@app.get("/trade-api/order/list")
async def trade_order_list(
    keyword: str = "", page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db), merchant_id: int | None = Depends(merchant_identity),
):
    return ok(await merchant_orders(db, merchant_id, keyword, page, page_size))


@app.put("/trade-api/order/ship/{order_id}")
async def trade_ship(order_id: int, payload: ShipInput, db: AsyncSession = Depends(get_db), merchant_id: int | None = Depends(merchant_identity)):
    return ok(await ship_order(db, order_id, payload, merchant_id), "发货成功")


@app.get("/trade-api/after-sale/list")
async def trade_after_sale_list(
    status: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db), merchant_id: int | None = Depends(merchant_identity),
):
    normalized = {"0": "APPLIED", "1": "APPROVED", "2": "REJECTED"}.get(status, status)
    return ok(await merchant_after_sales(db, merchant_id, normalized, page, page_size))


@app.put("/trade-api/after-sale/audit/{ticket_id}")
async def trade_after_sale_audit(ticket_id: int, payload: AuditInput, db: AsyncSession = Depends(get_db), merchant_id: int | None = Depends(merchant_identity)):
    return ok(await audit_after_sale(db, ticket_id, payload, merchant_id), "审核完成")
