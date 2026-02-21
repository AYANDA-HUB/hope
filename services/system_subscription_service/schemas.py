from pydantic import BaseModel
from datetime import date
from typing import Optional

class VoucherCreate(BaseModel):
    quantity: int
    plan: str
    amount: float
    expires_at: date

class VoucherOut(BaseModel):
    code: str
    plan: str
    amount: float
    is_redeemed: bool
    expires_at: Optional[date]

    class Config:
        from_attributes = True

class RedeemVoucher(BaseModel):
    voucher_code: str

class CardPayment(BaseModel):
    plan: str
    amount: float
