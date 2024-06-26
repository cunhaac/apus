# auth.py
import jwt
import bcrypt

from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, Header, status
from sqlalchemy.orm import Session


from settings import SECRET_KEY, ALGORITHM
from dependencies import get_db
from schemas.models import User, RevokedToken
from schemas.requests import UserLogin, UserSignup
from handlers.handlers import create_access_token, decode_access_token

router = APIRouter()


# Login route
@router.post("/login")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_login.email).first()

    if user is None or not bcrypt.checkpw(user_login.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(
            status_code=401, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "user": user.username}


# Route for user signup
@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_signup: UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.username == user_signup.username).first()
    existing_email = db.query(User).filter(
        User.email == user_signup.email).first()

    if existing_user:
        raise HTTPException(status_code=409, detail={
                            "message": "Username already exist", "user_exists": True})

    if existing_email:
        raise HTTPException(status_code=409, detail={
                            "message": "Email already exist", "email_exists": True})

    # Hash the password before storing it
    hashed_password = bcrypt.hashpw(
        user_signup.password.encode('utf-8'), bcrypt.gensalt())

    new_user = User(username=user_signup.username, email=user_signup.email,
                    password=hashed_password.decode('utf-8'))
    db.add(new_user)
    db.commit()

    return {"message": "User created successfully"}


# Logout route
@ router.post("/logout")
async def logout(token: str = Header(...), db: Session = Depends(get_db)):

    if not token:
        return {"message": "No token provided."}

    # Decode token to get user information
    decoded_token = decode_access_token(token)

    # Check if the token has been revoked
    if db.query(RevokedToken).filter(RevokedToken.jti == decoded_token["jti"]).first():
        raise HTTPException(status_code=401, detail="Token has been revoked")

    # Add token to the revocation list in the database
    db_token = RevokedToken(jti=decoded_token["jti"])
    db.add(db_token)
    db.commit()

    return {"message": "Logged out successfully"}


# Refresh token route
@ router.post("/token-refresh")
async def refresh_token(token: str = Header(...), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    # Decode the  token
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Could not decode token")

    # Check if the  token has been revoked
    if db.query(RevokedToken).filter(RevokedToken.jti == decoded_token["jti"]).first():
        raise HTTPException(status_code=401, detail="Token has been revoked")

    # Get user information from the token
    username = decoded_token.get("sub")

    # Check if the user exists
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Add token to the revocation list in the database
    db_token = RevokedToken(jti=decoded_token["jti"])
    db.add(db_token)
    db.commit()

    # Create a new access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires)

    return {"access_token": access_token, "user": user.username}
