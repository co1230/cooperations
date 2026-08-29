from typing import Literal

from pydantic import BaseModel, Field, field_validator


class CartAdd(BaseModel):
    source_product_id: int
    spec_labels: list[str] = Field(min_length=1)
    quantity: int = Field(default=1, ge=1, le=99)


class CartUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=1, le=99)
    selected: bool | None = None


class SelectionUpdate(BaseModel):
    item_ids: list[int]
    selected: bool


class BuyNowItem(BaseModel):
    source_product_id: int
    spec_labels: list[str] = Field(min_length=1)
    quantity: int = Field(default=1, ge=1, le=99)


class CheckoutInput(BaseModel):
    mode: Literal["cart", "buy_now"] = "cart"
    buy_now: BuyNowItem | None = None


class AddressInput(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    # 本地演示数据里存在短号/分机号；此处只要求非空。
    # 上线时应在 A 的用户/地址服务中统一校验真实手机号格式。
    phone: str = Field(min_length=1, max_length=20)
    address: str = Field(min_length=1, max_length=500)

    @field_validator("name", "phone", "address", mode="before")
    @classmethod
    def normalize_text(cls, value):
        # 兼容旧版地址缓存中的数字手机号等可安全转为文本的值。
        return "" if value is None else str(value).strip()


class CreateOrderInput(CheckoutInput):
    address: AddressInput
    request_id: str = Field(min_length=8, max_length=80)


class PayInput(BaseModel):
    checkout_no: str
    request_id: str = Field(min_length=8, max_length=80)
    payment_method: Literal["ALIPAY", "WECHAT", "BANK_CARD", "MOCK"] = "MOCK"


class AfterSaleInput(BaseModel):
    ticket_type: Literal["REFUND_ONLY", "RETURN_REFUND", "EXCHANGE"] = "REFUND_ONLY"
    reason: str = Field(min_length=1, max_length=200)
    description: str | None = None
    order_item_id: int | None = None
    requested_amount: float | None = Field(default=None, gt=0)


class ShipInput(BaseModel):
    express_company: str = Field(min_length=1, max_length=100)
    tracking_number: str = Field(min_length=1, max_length=100)


class AuditInput(BaseModel):
    status: int | Literal["APPROVED", "REJECTED"]
    result: str | None = Field(default=None, max_length=500)
