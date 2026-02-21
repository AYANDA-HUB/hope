from pydantic import BaseModel

class FollowStatusResponse(BaseModel):
    is_following: bool


class FollowersCountResponse(BaseModel):
    followers: int
