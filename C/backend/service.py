import hashlib
import json
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from secrets import token_hex

from fastapi import HTTPException
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.mysql import insert as mysql_insert

from models import (
    AfterSaleTicket, CartItem, IdempotencyRecord, Order, OrderItem,
    OrderStatusLog, PaymentRecord, Product, ShoppingCart, User,
)

PRODUCTS_FILE = Path(__file__).resolve().parents[2] / "B" / "web" / "src" / "mock" / "products.json"
_catalog = None


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def catalog():
    global _catalog
    if _catalog is None:
        with PRODUCTS_FILE.open("r", encoding="utf-8") as stream:
            _catalog = {int(item["id"]): item for item in json.load(stream)}
    return _catalog


def public_money(value) -> float:
    return float(money(value))


async def ensure_user(db: AsyncSession, user_id: int, username: str = "演示用户") -> User:
    user = await db.get(User, user_id)
    if not user:
        # CartProvider 会并发加载购物车和订单。使用 INSERT IGNORE 保证两个请求
        # 同时初始化同一个演示买家时不会产生 Duplicate primary key。
        await db.execute(mysql_insert(User).values(
            id=user_id, username=username or f"用户{user_id}", email=f"buyer-{user_id}@demo.local",
            password_hash="DEMO_ONLY", role="BUYER", account_status="ACTIVE",
        ).prefix_with("IGNORE"))
        await db.flush()
        user = await db.get(User, user_id, populate_existing=True)
        if not user:
            raise HTTPException(500, "初始化交易用户失败")
    if user.account_status != "ACTIVE":
        raise HTTPException(403, "账号不可用")
    return user


async def ensure_product(db: AsyncSession, source_id: int, labels: list[str]) -> Product:
    source = catalog().get(int(source_id))
    if not source:
        raise HTTPException(404, "商品不存在")
    spec_key = "|".join(labels)
    combo = next((item for item in source.get("combos", []) if item["key"] == spec_key), None)
    if not combo:
        raise HTTPException(400, "商品规格不存在")
    product = await db.scalar(select(Product).where(
        Product.source_product_id == source_id, Product.spec_key == spec_key
    ))
    if product:
        return product
    merchant_id = 1_000_000 + int(source["shopId"])
    merchant = await db.get(User, merchant_id)
    if not merchant:
        merchant = User(
            id=merchant_id, username=f"店铺{source['shopId']}", email=f"merchant-{source['shopId']}@demo.local",
            password_hash="DEMO_ONLY", role="MERCHANT", account_status="ACTIVE",
        )
        db.add(merchant)
        await db.flush()
    digest = hashlib.sha1(spec_key.encode("utf-8")).hexdigest()[:12]
    product = Product(
        merchant_id=merchant_id, name=source["name"], sku=f"B-{source_id}-{digest}",
        description=source.get("desc"), price=money(combo["price"]), stock=int(combo["stock"]),
        cover_url=source.get("image"), product_status="ON_SALE", source_product_id=source_id,
        source_shop_id=int(source["shopId"]), spec_key=spec_key,
    )
    db.add(product)
    await db.flush()
    return product


async def get_cart(db: AsyncSession, user_id: int, create: bool = True) -> ShoppingCart | None:
    cart = await db.scalar(select(ShoppingCart).where(ShoppingCart.buyer_id == user_id))
    if not cart and create:
        cart = ShoppingCart(buyer_id=user_id)
        db.add(cart)
        await db.flush()
    return cart


def cart_item_json(item: CartItem, product: Product) -> dict:
    return {
        "id": item.id, "key": str(item.id), "productId": product.source_product_id,
        "skuLabels": product.spec_key.split("|"), "price": public_money(product.price),
        "qty": item.quantity, "checked": item.selected, "maxStock": product.stock,
        "name": product.name, "image": product.cover_url, "shopId": product.source_shop_id,
    }


async def list_cart(db: AsyncSession, user_id: int) -> list[dict]:
    cart = await get_cart(db, user_id)
    rows = (await db.execute(
        select(CartItem, Product).join(Product, Product.id == CartItem.product_id)
        .where(CartItem.cart_id == cart.id).order_by(CartItem.created_at.desc())
    )).all()
    return [cart_item_json(item, product) for item, product in rows]


async def add_cart(db: AsyncSession, user_id: int, source_id: int, labels: list[str], quantity: int) -> dict:
    product = await ensure_product(db, source_id, labels)
    if product.product_status != "ON_SALE" or product.stock < quantity:
        raise HTTPException(409, "库存不足或商品已下架")
    cart = await get_cart(db, user_id)
    item = await db.scalar(select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product.id))
    if item:
        item.quantity = min(item.quantity + quantity, product.stock)
        item.selected = True
    else:
        item = CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity, selected=True)
        db.add(item)
    await db.flush()
    return cart_item_json(item, product)


async def checkout_lines(db: AsyncSession, user_id: int, mode: str, buy_now=None):
    if mode == "buy_now":
        if not buy_now:
            raise HTTPException(400, "立即购买缺少商品")
        product = await ensure_product(db, buy_now.source_product_id, buy_now.spec_labels)
        return [(None, product, buy_now.quantity)]
    cart = await get_cart(db, user_id, False)
    if not cart:
        raise HTTPException(400, "购物车为空")
    rows = (await db.execute(
        select(CartItem, Product).join(Product, Product.id == CartItem.product_id)
        .where(CartItem.cart_id == cart.id, CartItem.selected.is_(True))
    )).all()
    if not rows:
        raise HTTPException(400, "请选择要结算的商品")
    return [(item, product, item.quantity) for item, product in rows]


def preview_json(lines) -> dict:
    groups = defaultdict(list)
    original = Decimal("0")
    quantity = 0
    for _, product, qty in lines:
        subtotal = money(product.price * qty)
        original += subtotal
        quantity += qty
        groups[product.merchant_id].append({
            "productId": product.source_product_id, "name": product.name, "image": product.cover_url,
            "skuLabels": product.spec_key.split("|"), "price": public_money(product.price),
            "qty": qty, "subtotal": public_money(subtotal), "shopId": product.source_shop_id,
        })
    discount = money(20 if original >= 199 else 0)
    return {
        "groups": [{"merchantId": key, "shopId": values[0]["shopId"], "items": values} for key, values in groups.items()],
        "totalQty": quantity, "originalAmount": public_money(original),
        "discountAmount": public_money(discount), "payAmount": public_money(original - discount),
    }


def order_json(order: Order, items: list[OrderItem] | None = None) -> dict:
    result = {
        "id": order.id, "no": order.order_no, "checkoutNo": order.checkout_no,
        "merchantId": order.merchant_id, "totalPrice": public_money(order.original_amount),
        "discountPrice": public_money(order.discount_amount), "payPrice": public_money(order.total_amount),
        "status": order.order_status, "afterSaleStatus": order.after_sale_status,
        "address": {"name": order.receiver_name, "phone": order.receiver_phone, "address": order.receiver_address},
        "expressCompany": order.express_company, "trackingNumber": order.tracking_number,
        "expiresAt": order.expires_at.isoformat() if order.expires_at else None,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
    }
    if items is not None:
        result["items"] = [{
            "id": item.id, "productId": item.source_product_id, "name": item.product_name,
            "image": item.cover_url, "skuLabels": item.sku.split("|"),
            "price": public_money(item.unit_price), "qty": item.quantity,
        } for item in items]
    return result


async def create_orders(db: AsyncSession, user_id: int, payload) -> dict:
    old = await db.scalar(select(IdempotencyRecord).where(
        IdempotencyRecord.scope == "CREATE_ORDER", IdempotencyRecord.user_id == user_id,
        IdempotencyRecord.request_id == payload.request_id,
    ))
    if old:
        return old.response_json
    lines = await checkout_lines(db, user_id, payload.mode, payload.buy_now)
    product_ids = [product.id for _, product, _ in lines]
    locked = {item.id: item for item in (await db.scalars(
        select(Product).where(Product.id.in_(product_ids)).with_for_update()
    )).all()}
    lines = [(cart_item, locked[product.id], qty) for cart_item, product, qty in lines]
    for _, product, qty in lines:
        if product.product_status != "ON_SALE" or product.stock < qty:
            raise HTTPException(409, f"{product.name} 库存不足")
    summary = preview_json(lines)
    discount_total = money(summary["discountAmount"])
    original_total = money(summary["originalAmount"])
    checkout_no = f"CK{datetime.now():%Y%m%d%H%M%S}{token_hex(3).upper()}"
    grouped = defaultdict(list)
    for line in lines:
        grouped[line[1].merchant_id].append(line)
    response_orders = []
    allocated = Decimal("0")
    group_entries = list(grouped.items())
    for index, (merchant_id, group) in enumerate(group_entries):
        original = sum((money(product.price * qty) for _, product, qty in group), Decimal("0"))
        discount = discount_total - allocated if index == len(group_entries) - 1 else money(discount_total * original / original_total)
        allocated += discount
        order = Order(
            order_no=f"YG{datetime.now():%Y%m%d%H%M%S}{token_hex(3).upper()}", checkout_no=checkout_no,
            buyer_id=user_id, merchant_id=merchant_id, original_amount=original, discount_amount=discount,
            total_amount=original - discount, receiver_name=payload.address.name,
            receiver_phone=payload.address.phone, receiver_address=payload.address.address,
            expires_at=datetime.now() + timedelta(minutes=30), order_status="PENDING_PAYMENT",
        )
        db.add(order)
        await db.flush()
        for _, product, qty in group:
            db.add(OrderItem(
                order_id=order.id, product_id=product.id, product_name=product.name,
                source_product_id=product.source_product_id, cover_url=product.cover_url,
                sku=product.spec_key, unit_price=product.price, quantity=qty,
                subtotal=money(product.price * qty),
            ))
            product.stock -= qty
        db.add(OrderStatusLog(order_id=order.id, operator_id=user_id, status_type="ORDER", to_status="PENDING_PAYMENT", remark="用户提交订单"))
        response_orders.append(order_json(order))
    if payload.mode == "cart":
        cart_ids = [item.id for item, _, _ in lines if item]
        if cart_ids:
            await db.execute(delete(CartItem).where(CartItem.id.in_(cart_ids)))
    response = {"checkoutNo": checkout_no, "orders": response_orders, "payAmount": summary["payAmount"]}
    db.add(IdempotencyRecord(scope="CREATE_ORDER", user_id=user_id, request_id=payload.request_id, response_json=response))
    await db.flush()
    return response


async def list_orders(db: AsyncSession, user_id: int) -> list[dict]:
    orders = (await db.scalars(select(Order).where(Order.buyer_id == user_id).order_by(Order.created_at.desc()))).all()
    result = []
    for order in orders:
        items = (await db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))).all()
        result.append(order_json(order, items))
    return result


async def pay_orders(db: AsyncSession, user_id: int, payload) -> dict:
    old = await db.scalar(select(IdempotencyRecord).where(
        IdempotencyRecord.scope == "PAY", IdempotencyRecord.user_id == user_id,
        IdempotencyRecord.request_id == payload.request_id,
    ))
    if old:
        return old.response_json
    orders = (await db.scalars(select(Order).where(
        Order.checkout_no == payload.checkout_no, Order.buyer_id == user_id
    ).with_for_update())).all()
    if not orders:
        raise HTTPException(404, "订单不存在")
    if all(order.order_status == "PAID" for order in orders):
        response = {"checkoutNo": payload.checkout_no, "status": "SUCCESS", "orders": [order.id for order in orders]}
    else:
        now = datetime.now()
        if any(order.order_status != "PENDING_PAYMENT" for order in orders):
            raise HTTPException(409, "订单状态不允许支付")
        if any(order.expires_at and order.expires_at < now for order in orders):
            raise HTTPException(409, "订单已超时，请取消后重新下单")
        for order in orders:
            order.order_status, order.paid_at = "PAID", now
            db.add(PaymentRecord(
                payment_no=f"PAY{datetime.now():%Y%m%d%H%M%S}{token_hex(3).upper()}", request_id=payload.request_id,
                order_id=order.id, buyer_id=user_id, amount=order.total_amount,
                payment_method=payload.payment_method, payment_status="SUCCESS",
                third_party_trade_no=f"MOCK-{token_hex(8)}", paid_at=now,
            ))
            db.add(OrderStatusLog(order_id=order.id, operator_id=user_id, status_type="ORDER", from_status="PENDING_PAYMENT", to_status="PAID", remark="模拟支付成功"))
        response = {"checkoutNo": payload.checkout_no, "status": "SUCCESS", "orders": [order.id for order in orders]}
    db.add(IdempotencyRecord(scope="PAY", user_id=user_id, request_id=payload.request_id, response_json=response))
    await db.flush()
    return response


async def cancel_order(db: AsyncSession, user_id: int, order_id: int) -> dict:
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.buyer_id == user_id).with_for_update())
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.order_status != "PENDING_PAYMENT":
        raise HTTPException(409, "只能取消待支付订单")
    items = (await db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))).all()
    products = {product.id: product for product in (await db.scalars(
        select(Product).where(Product.id.in_([item.product_id for item in items])).with_for_update()
    )).all()}
    for item in items:
        products[item.product_id].stock += item.quantity
    order.order_status = "CANCELLED"
    db.add(OrderStatusLog(order_id=order.id, operator_id=user_id, status_type="ORDER", from_status="PENDING_PAYMENT", to_status="CANCELLED", remark="用户取消"))
    return order_json(order, items)


async def change_fulfillment(db: AsyncSession, user_id: int, order_id: int, action: str) -> dict:
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.buyer_id == user_id).with_for_update())
    if not order:
        raise HTTPException(404, "订单不存在")
    if action == "confirm" and order.order_status == "SHIPPED":
        old = order.order_status
        order.order_status, order.completed_at = "COMPLETED", datetime.now()
        db.add(OrderStatusLog(order_id=order.id, operator_id=user_id, status_type="ORDER", from_status=old, to_status="COMPLETED", remark="用户确认收货"))
    else:
        raise HTTPException(409, "当前订单不能执行该操作")
    return order_json(order)


async def apply_after_sale(db: AsyncSession, user_id: int, order_id: int, payload) -> dict:
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.buyer_id == user_id).with_for_update())
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.order_status not in {"PAID", "SHIPPED", "COMPLETED"} or order.after_sale_status not in {"NONE", "REJECTED", "CLOSED"}:
        raise HTTPException(409, "当前订单不能申请售后")
    requested = money(payload.requested_amount or order.total_amount)
    if requested > money(order.total_amount):
        raise HTTPException(400, "退款金额不能超过实付金额")
    ticket = AfterSaleTicket(
        ticket_no=f"AS{datetime.now():%Y%m%d%H%M%S}{token_hex(3).upper()}", order_id=order.id,
        order_item_id=payload.order_item_id, buyer_id=user_id, merchant_id=order.merchant_id,
        ticket_type=payload.ticket_type, reason=payload.reason, description=payload.description,
        requested_amount=requested, status="APPLIED", deadline=datetime.now() + timedelta(hours=48),
    )
    db.add(ticket)
    order.after_sale_status = "APPLIED"
    db.add(OrderStatusLog(order_id=order.id, operator_id=user_id, status_type="AFTER_SALE", from_status="NONE", to_status="APPLIED", remark=payload.reason))
    await db.flush()
    return {"id": ticket.id, "ticketNo": ticket.ticket_no, "status": ticket.status}


async def merchant_orders(db: AsyncSession, merchant_id: int | None, keyword: str, page: int, page_size: int) -> dict:
    filters = [Order.order_status != "PENDING_PAYMENT"]
    if merchant_id:
        filters.append(Order.merchant_id == merchant_id)
    if keyword:
        filters.append(Order.order_no.contains(keyword))
    total = await db.scalar(select(func.count(Order.id)).where(*filters))
    orders = (await db.scalars(select(Order).where(*filters).order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).all()
    rows = []
    for order in orders:
        items = (await db.scalars(select(OrderItem).where(OrderItem.order_id == order.id))).all()
        rows.append({
            "id": order.id, "order_no": order.order_no,
            "product_name": " / ".join(item.product_name for item in items),
            "total_amount": public_money(order.total_amount), "status": order.order_status,
            "tracking_number": order.tracking_number, "express_company": order.express_company,
            "buyer_id": order.buyer_id, "after_sale_status": order.after_sale_status,
        })
    return {"list": rows, "total": total or 0}


async def ship_order(db: AsyncSession, order_id: int, payload, merchant_id: int | None) -> dict:
    filters = [Order.id == order_id]
    if merchant_id:
        filters.append(Order.merchant_id == merchant_id)
    order = await db.scalar(select(Order).where(*filters).with_for_update())
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.order_status != "PAID":
        raise HTTPException(409, "只有已支付订单可以发货")
    order.order_status, order.shipped_at = "SHIPPED", datetime.now()
    order.express_company, order.tracking_number = payload.express_company, payload.tracking_number
    db.add(OrderStatusLog(order_id=order.id, operator_id=merchant_id, status_type="ORDER", from_status="PAID", to_status="SHIPPED", remark=f"{payload.express_company} {payload.tracking_number}"))
    return {"id": order.id, "status": order.order_status}


async def merchant_after_sales(db: AsyncSession, merchant_id: int | None, status: str | None, page: int, page_size: int) -> dict:
    filters = []
    if merchant_id:
        filters.append(AfterSaleTicket.merchant_id == merchant_id)
    if status:
        filters.append(AfterSaleTicket.status == status)
    total = await db.scalar(select(func.count(AfterSaleTicket.id)).where(*filters))
    tickets = (await db.scalars(select(AfterSaleTicket).where(*filters).order_by(AfterSaleTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).all()
    return {"list": [{
        "id": item.id, "after_sale_no": item.ticket_no, "order_id": item.order_id,
        "type": item.ticket_type, "reason": item.reason, "status": item.status,
        "requested_amount": public_money(item.requested_amount or 0), "merchant_reply": item.merchant_reply,
    } for item in tickets], "total": total or 0}


async def audit_after_sale(db: AsyncSession, ticket_id: int, payload, merchant_id: int | None) -> dict:
    filters = [AfterSaleTicket.id == ticket_id]
    if merchant_id:
        filters.append(AfterSaleTicket.merchant_id == merchant_id)
    ticket = await db.scalar(select(AfterSaleTicket).where(*filters).with_for_update())
    if not ticket:
        raise HTTPException(404, "售后工单不存在")
    if ticket.status not in {"APPLIED", "PROCESSING"}:
        raise HTTPException(409, "该售后工单已处理")
    approved = payload.status in {1, "APPROVED"}
    old = ticket.status
    ticket.status = "APPROVED" if approved else "REJECTED"
    ticket.merchant_reply = payload.result
    order = await db.get(Order, ticket.order_id)
    order.after_sale_status = ticket.status
    db.add(OrderStatusLog(order_id=order.id, operator_id=merchant_id, status_type="AFTER_SALE", from_status=old, to_status=ticket.status, remark=payload.result))
    return {"id": ticket.id, "status": ticket.status}
