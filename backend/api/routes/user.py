"""Current-user / role endpoints.

Powers the onboarding flow: after Clerk sign-up the frontend calls GET /me,
and if `onboarded` is false it shows a role picker that POSTs to /role.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

from api.deps import get_authenticated_user
from core.database import get_db
from models.schemas import User

router = APIRouter()

Role = Literal["student", "professor", "hiring"]


class UserResponse(BaseModel):
    id: Optional[str] = None
    clerk_id: str
    email: str
    name: Optional[str] = None
    role: str
    onboarded: bool = False


class RoleUpdate(BaseModel):
    role: Role


def _to_response(clerk_id: str, doc: Optional[dict], fallback: User) -> UserResponse:
    doc = doc or {}
    return UserResponse(
        id=str(doc["_id"]) if doc.get("_id") else None,
        clerk_id=clerk_id,
        email=doc.get("email") or fallback.email,
        name=doc.get("name") or fallback.name,
        role=doc.get("role") or fallback.role or "student",
        onboarded=bool(doc.get("onboarded", False)),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_authenticated_user)):
    """Return the current user, including role and whether they've onboarded."""
    db = get_db()
    doc = await db.users.find_one({"clerk_id": current_user.clerk_id})
    return _to_response(current_user.clerk_id, doc, current_user)


@router.post("/role", response_model=UserResponse)
async def set_role(body: RoleUpdate, current_user: User = Depends(get_authenticated_user)):
    """Set the current user's role and mark them onboarded (the picker action)."""
    db = get_db()
    await db.users.update_one(
        {"clerk_id": current_user.clerk_id},
        {"$set": {"role": body.role, "onboarded": True, "updated_at": datetime.utcnow()}},
    )
    doc = await db.users.find_one({"clerk_id": current_user.clerk_id})
    return _to_response(current_user.clerk_id, doc, current_user)
