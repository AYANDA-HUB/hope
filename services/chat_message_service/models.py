from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    TIMESTAMP,
    Text,
    DateTime,
    Enum,
    Boolean
)
from sqlalchemy.dialects.mysql import LONGTEXT # Import LONGTEXT for MariaDB/MySQL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.database import Base

# Note: Ensure your User model in services.auth_service.models 
# has a profile_pic = Column(String(255), nullable=True) field.

# ------------------------- One-to-one chat -------------------------
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Sender & Receiver
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_read = Column(Boolean, default=False)
    is_seen = Column(Boolean, default=False)

    # School boundary
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)

    # Message content
    message_type = Column(
        Enum("text", "image", "voice", name="chat_message_type"),
        nullable=False
    )
    message = Column(Text, nullable=True)
    image_url = Column(LONGTEXT, nullable=True) 
    voice_note_url = Column(LONGTEXT, nullable=True)

    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        nullable=False
    )

    # Relationships
    sender = relationship(
        "User",
        foreign_keys=[sender_id],
        backref="sent_messages"
    )
    receiver = relationship(
        "User",
        foreign_keys=[receiver_id],
        backref="received_messages"
    )
    school = relationship("School")


# ------------------------- Groups -------------------------
class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    members = relationship("GroupMember", back_populates="group")
    messages = relationship("GroupMessage", back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    group = relationship("Group", back_populates="members")


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))

    message_type = Column(
        Enum("text", "image", "voice", name="group_message_type"),
        nullable=False
    )
    message = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    voice_note_url = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Group", back_populates="messages")

# ------------------------- Group Tracking (New) -------------------------
class GroupReadStatus(Base):
    __tablename__ = "group_read_status"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    last_read_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# ------------------------- Reactions -------------------------

# 1. One-to-One Chat Reactions
class ChatReaction(Base):
    __tablename__ = "chat_reactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reaction = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
# 2. Group Chat Reactions
class GroupMessageReaction(Base):
    __tablename__ = "group_message_reactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("group_messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reaction = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- Relationships for classes ---
ChatMessage.reactions = relationship("ChatReaction", backref="message", cascade="all, delete-orphan")
GroupMessage.reactions = relationship("GroupMessageReaction", backref="message", cascade="all, delete-orphan")

# ------------------------- Community messages -------------------------
class CommunityMessage(Base):
    __tablename__ = "community_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)

    # Message content
    message_type = Column(
        Enum("text", "image", "voice", name="community_message_type"),
        nullable=False
    )
    message = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    voice_note_url = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User")
    school = relationship("School")
    
    # Relationship for reactions
    reactions = relationship("CommunityReaction", back_populates="message", cascade="all, delete-orphan")


# ------------------------- Community Reactions -------------------------
class CommunityReaction(Base):
    __tablename__ = "community_reactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("community_messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reaction = Column(String(50), nullable=False)  # Stores emoji or reaction string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    

    # Relationships
    message = relationship("CommunityMessage", back_populates="reactions")
    user = relationship("User")
