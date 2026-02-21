from sqlalchemy import Column, Integer, String, Enum, Boolean, DECIMAL, Date, TIMESTAMP, func
from services.database import Base

class SystemSubscription(Base):
    __tablename__ = "system_subscriptions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    plan = Column(Enum('monthly','yearly'), nullable=False)
    payment_method = Column(Enum('card','voucher'), nullable=False)
    payment_status = Column(Enum('pending','completed','failed'), default='pending')
    amount = Column(DECIMAL(10,2), nullable=False)
    transaction_reference = Column(String(255))
    voucher_code = Column(String(50))
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Voucher(Base):
    __tablename__ = "vouchers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False)
    plan = Column(Enum('monthly','yearly'), nullable=False)
    amount = Column(DECIMAL(10,2), nullable=False)
    is_redeemed = Column(Boolean, default=False)
    redeemed_by = Column(Integer, nullable=True)
    redeemed_at = Column(TIMESTAMP, nullable=True)
    created_by = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    expires_at = Column(Date, nullable=True)
