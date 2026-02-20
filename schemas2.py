from pydantic import BaseModel, model_validator
from typing import Optional, List
from datetime import datetime

# ------------------------- Reaction Schemas -------------------------
class MessageReactionBase(BaseModel):
    reaction: str  # Emoji or reaction string

class MessageReactionCreate(MessageReactionBase):
    message_id: int

class MessageReactionResponse(MessageReactionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------- Base message schema -------------------------
class ChatMessageBase(BaseModel):
    receiver_id: int
    message_type: str  # "text", "image", "voice"
    message: Optional[str] = None
    image_url: Optional[str] = None
    voice_note_url: Optional[str] = None


# ------------------------- Create one-to-one message -------------------------
class ChatMessageCreate(ChatMessageBase):
    school_id: int

    @model_validator(mode="after")
    def validate_message_content(self):
        if self.message_type not in ("text", "image", "voice"):
            raise ValueError("message_type must be 'text', 'image', or 'voice'")
        return self


class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: Optional[str] = None   # ✅ allow None
    receiver_id: int
    receiver_name: Optional[str] = None  # ✅ allow None
    school_id: int
    message_type: str
    message: Optional[str]
    image_url: Optional[str]
    voice_note_url: Optional[str]
    read: Optional[bool] = False   # ✅ maps from is_read
    seen: Optional[bool] = False   # ✅ maps from is_seen
    created_at: datetime
    reactions: List[MessageReactionResponse] = []

    class Config:
        from_attributes = True

    # ✅ ADD THIS (auto-map SQLAlchemy → schema)
    @model_validator(mode="before")
    @classmethod
    def map_fields(cls, data):
        if hasattr(data, "sender"):
            data.sender_name = getattr(data.sender, "fullname", None)

        if hasattr(data, "receiver"):
            data.receiver_name = getattr(data.receiver, "fullname", None)

        if hasattr(data, "is_read"):
            data.read = data.is_read

        if hasattr(data, "is_seen"):
            data.seen = data.is_seen

        return data


# ------------------------- User search response -------------------------
class UserSearchResponse(BaseModel):
    id: int
    fullname: Optional[str]
    username: str
    role: str
    profile_pic: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------------- Group Schemas -------------------------
class GroupCreate(BaseModel):
    name: str

class GroupResponse(BaseModel):
    id: int
    name: str
    last_message: Optional[str] = ""
    last_message_time: Optional[str] = None
    unread_count: int = 0
    role: str = "group"

    class Config:
        from_attributes = True

class GroupMemberResponse(BaseModel):
    id: int
    user_id: int
    fullname: str
    role: str

    class Config:
        from_attributes = True


class GroupMessageCreate(BaseModel):
    group_id: int
    message_type: str
    message: Optional[str] = None
    image_url: Optional[str] = None
    voice_note_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_message_content(self):
        if self.message_type not in ("text", "image", "voice"):
            raise ValueError("message_type must be 'text', 'image', or 'voice'")
        return self


class GroupMessageResponse(BaseModel):
    id: int
    group_id: int
    sender_id: int
    sender_name: Optional[str] = None  # ✅ allow None
    message_type: str
    message: Optional[str]
    image_url: Optional[str]
    voice_note_url: Optional[str]
    created_at: datetime
    reactions: List[MessageReactionResponse] = []

    class Config:
        from_attributes = True

    # ✅ ADD THIS
    @model_validator(mode="before")
    @classmethod
    def map_sender_name(cls, data):
        if hasattr(data, "sender"):
            data.sender_name = getattr(data.sender, "fullname", None)
        return data


# ------------------------- Community Schemas -------------------------
class CommunityMessageCreate(BaseModel):
    message_type: str
    message: Optional[str] = None
    image_url: Optional[str] = None
    voice_note_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_message_content(self):
        if self.message_type not in ("text", "image", "voice"):
            raise ValueError("message_type must be 'text', 'image', or 'voice'")
        return self


class CommunityMessageResponse(BaseModel):
    id: int
    school_id: int
    sender_id: int
    sender_name: Optional[str] = None  # ✅ allow None
    message_type: str
    message: Optional[str]
    image_url: Optional[str]
    voice_note_url: Optional[str]
    created_at: datetime
    reactions: List[MessageReactionResponse] = []

    class Config:
        from_attributes = True

    # ✅ ADD THIS
    @model_validator(mode="before")
    @classmethod
    def map_sender_name(cls, data):
        if hasattr(data, "sender"):
            data.sender_name = getattr(data.sender, "fullname", None)
        return data


# Backward compatibility aliases
CommunityReactionCreate = MessageReactionCreate
CommunityReactionResponse = MessageReactionResponse