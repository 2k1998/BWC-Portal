import os
from fastapi import APIRouter, Depends, HTTPException, status, Form, Query, Response  # No UploadFile, File from previous revert
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from database import get_db
from models import User, PasswordResetToken  # <--- IMPORT PasswordResetToken
from schemas import UserCreate, UserResponse, Token, UserUpdate, UserRoleUpdate, UserStatusUpdate, PasswordResetRequest, PasswordReset  # <--- IMPORT PasswordResetRequest, PasswordReset
from typing import Optional, List
from .utils import check_roles
import uuid  # Still needed for UUID for tokens
from utils.email_sender import send_email  # <--- IMPORT send_email UTILITY

# Load secret key and token expiration from environment variables (or use defaults)
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 240))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

router = APIRouter()

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=120))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/token", response_model=Token)
def login(
    username: str = Form(),
    password: str = Form(),
    grant_type: str = Form(default="password"),
    scope: str = Form(default=""),
    client_id: Optional[str] = Form(default=None),
    client_secret: Optional[str] = Form(default=None),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email, "id": user.id}, expires_delta=access_token_expires)
    return Token(access_token=access_token, token_type="bearer")

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        # --- NEW: Use first_name and surname ---
        first_name=user.first_name,  # <--- NEW
        surname=user.surname,        # <--- NEW
        # full_name=user.full_name,  # <--- REMOVE THIS
        # --- END NEW ---
        birthday=user.birthday
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users/me", response_model=UserResponse)  # <--- ADD response_model=UserResponse BACK
def read_users_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Remove the debug print if it's here
    # print(f"DEBUG_BACKEND: read_users_me - current_user before return: ...")
    # --- Revert to original simple return ---
    return current_user
# --- END Revert ---

@router.put("/users/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.surname is not None:
        current_user.surname = user_update.surname
    if user_update.birthday is not None:
        current_user.birthday = user_update.birthday
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users/all", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search users by email or full name")
):
    check_roles(current_user, ["admin"])
    query = db.query(User)
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            (User.email.ilike(search_pattern)) |
            (User.first_name.ilike(search_pattern)) |
            (User.surname.ilike(search_pattern))
        )
    return query.all()

# <--- NEW ADMIN PANEL ENDPOINTS ---
@router.get("/users/{user_id}", response_model=UserResponse)  # <--- NEW: Get User by ID
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_roles(current_user, ["admin"])  # Only admins can get any user by ID

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}/role", response_model=UserResponse)  # <--- NEW: Update User Role
def update_user_role(user_id: int, role_update: UserRoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_roles(current_user, ["admin"])  # Only admins can update roles

    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot change their own role via this endpoint. Use direct DB access for self-demotion/promotion if needed.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Basic role validation (optional, but good practice)
    allowed_roles = ["admin", "user"]
    if role_update.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {role_update.role}. Allowed roles are: {', '.join(allowed_roles)}")

    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/status", response_model=UserResponse)  # <--- NEW: Toggle User Active Status
def update_user_status(user_id: int, status_update: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_roles(current_user, ["admin"])  # Only admins can update status

    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot deactivate their own account via this endpoint. Contact another admin or use direct DB access.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=204)  # <--- NEW: Delete User
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_roles(current_user, ["admin"])  # Only admins can delete users

    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot delete their own account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return Response(status_code=204)
# <--- END NEW ADMIN PANEL ENDPOINTS ---

# <--- NEW PASSWORD RESET ENDPOINTS ---
@router.post("/auth/request-password-reset", response_model=dict)
def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        print(f"DEBUG_BACKEND: request_password_reset - User not found for email: {request.email}. Returning generic message.")
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    # Generate a unique token
    token = str(uuid.uuid4())
    current_utc_time = datetime.now(timezone.utc)
    expires_at_dt = current_utc_time + timedelta(minutes=60)

    # Invalidate any old tokens for this user before creating a new one (good practice)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})
    db.commit()  # Commit the invalidation of old tokens

    db_token = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).first()  # Re-query after invalidation
    if db_token:
        # Update existing token (if one was just invalidated or existed)
        db_token.token = token
        db_token.expires_at = expires_at_dt
        db_token.is_used = False
        db_token.created_at = current_utc_time
    else:
        # Create new token entry
        db_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at_dt,
            created_at=current_utc_time
        )
        db.add(db_token)
    db.commit()
    db.refresh(db_token)

    # Construct the reset link (Frontend URL will be adjusted later)
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    email_subject = "BWC Portal: Password Reset Request"
    email_body = f"""
    Dear {user.first_name or user.email},

    You have requested to reset your password for the BWC Portal.

    Please click on the following link to reset your password:
    {reset_link}

    This link will expire in 60 minutes.

    If you did not request a password reset, please ignore this email.

    Thank you,
    The BWC Portal Team
    """
    # Send the email
    print(f"DEBUG_BACKEND: Attempting to send reset email to: {user.email}")  # <--- ADD THIS LINE
    send_email(to_email=user.email, subject=email_subject, body=email_body)

    print(f"DEBUG_BACKEND: request_password_reset returning: {{'message': 'If an account with that email exists, a password reset link has been sent.'}}")
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/auth/reset-password", response_model=dict)
def reset_password(request: PasswordReset, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.is_used == False  # Ensure token is not already used
    ).first()

    if not reset_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token.")

    if reset_token.expires_at < datetime.now(timezone.utc):
        reset_token.is_used = True  # Mark as used even if expired
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token.")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found for this token.")

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    reset_token.is_used = True  # Mark token as used after successful reset
    db.commit()  # Commit user password update and token use status
    db.refresh(user)

    return {"message": "Password has been successfully reset."}
# <--- END NEW PASSWORD RESET ENDPOINTS ---