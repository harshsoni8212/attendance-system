from fastapi import FastAPI, Depends,status, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from database import engine, Base, SessionLocal
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.utils import verify_access_token
import models
from auth.utils import hash_password, verify_password, create_access_token 

app = FastAPI()

Base.metadata.create_all(bind=engine)

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_access_token(token)

    user = db.query(models.User).filter(
        models.User.email == payload.get("sub")
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


def require_role(required_role: str):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker
