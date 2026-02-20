from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
import random, string

from services.database import get_db
from . import models, schemas
from services.auth_service.dependencies import get_current_user, admin_only  # <-- import real auth
from services.auth_service.models import User

router = APIRouter()

# -----------------------------
# Helpers
# -----------------------------
def generate_voucher_code(length=12):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# -----------------------------
# Admin: Generate Vouchers
# -----------------------------
@router.post("/admin/vouchers/generate")
def generate_vouchers(
    data: schemas.VoucherCreate, 
    current_user: User = Depends(admin_only),  # only admin can access
    db: Session = Depends(get_db)
):
    vouchers_list = []
    for _ in range(data.quantity):
        code = generate_voucher_code()
        while db.query(models.Voucher).filter(models.Voucher.code == code).first():
            code = generate_voucher_code()
        voucher = models.Voucher(
            code=code,
            plan=data.plan,
            amount=data.amount,
            created_by=current_user.id,
            expires_at=data.expires_at
        )
        db.add(voucher)
        vouchers_list.append(code)
    db.commit()
    return {"message": f"{data.quantity} vouchers generated", "codes": vouchers_list}

# -----------------------------
# Admin: List Vouchers
# -----------------------------
@router.get("/admin/vouchers")
def list_vouchers(
    current_user: User = Depends(admin_only),  # only admin
    db: Session = Depends(get_db)
):
    vouchers = db.query(models.Voucher).all()
    return vouchers

# -----------------------------
# Student: Redeem Voucher
# -----------------------------
@router.post("/subscriptions/redeem-voucher")
def redeem_voucher(
    data: schemas.RedeemVoucher, 
    current_user: User = Depends(get_current_user),  # real JWT auth
    db: Session = Depends(get_db)
):
    if current_user.role != 'student':
        raise HTTPException(403, "Only students need subscription")
    
    voucher = db.query(models.Voucher).filter(models.Voucher.code == data.voucher_code).first()
    if not voucher:
        raise HTTPException(404, "Voucher not found")
    if voucher.is_redeemed:
        raise HTTPException(400, "Voucher already redeemed")
    if voucher.expires_at and voucher.expires_at < date.today():
        raise HTTPException(400, "Voucher expired")
    
    # Mark voucher redeemed
    voucher.is_redeemed = True
    voucher.redeemed_by = current_user.id
    voucher.redeemed_at = date.today()
    
    # Create subscription
    start = date.today()
    end = start + timedelta(days=30 if voucher.plan == 'monthly' else 365)
    subscription = models.SystemSubscription(
        user_id=current_user.id,
        plan=voucher.plan,
        payment_method='voucher',
        payment_status='completed',
        amount=voucher.amount,
        voucher_code=voucher.code,
        start_date=start,
        end_date=end
    )
    db.add(subscription)
    db.commit()
    return {"message": "Voucher redeemed, subscription activated", "expires_at": end}

# -----------------------------
# Student: Pay Card
# -----------------------------
@router.post("/subscriptions/pay-card")
def pay_card(
    data: schemas.CardPayment, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'student':
        raise HTTPException(403, "Only students need subscription")
    
    transaction_ref = generate_voucher_code(10)  # dummy transaction reference
    start = date.today()
    end = start + timedelta(days=30 if data.plan == 'monthly' else 365)
    
    subscription = models.SystemSubscription(
        user_id=current_user.id,
        plan=data.plan,
        payment_method='card',
        payment_status='completed',
        amount=data.amount,
        transaction_reference=transaction_ref,
        start_date=start,
        end_date=end
    )
    db.add(subscription)
    db.commit()
    return {"message": "Card payment successful, subscription activated", "expires_at": end}

# -----------------------------
# Subscription Status
# -----------------------------
@router.get("/subscriptions/status")
def subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'student':
        return {"status": "active", "message": "Admins and instructors do not need subscription"}
    
    sub = db.query(models.SystemSubscription)\
        .filter(models.SystemSubscription.user_id == current_user.id,
                models.SystemSubscription.payment_status == 'completed',
                models.SystemSubscription.end_date >= date.today())\
        .order_by(models.SystemSubscription.end_date.desc()).first()
    
    if sub:
        return {"status": "active", "expires_at": sub.end_date}
    else:
        return {"status": "inactive", "message": "Student subscription required"}
