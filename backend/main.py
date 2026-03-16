from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

from routers import auth_router, user_router, admin_router
from routers import teacher_router
from routers import attendance_router
from routers import analytics_router
from routers import ws_router

# ✅ Create app FIRST
app = FastAPI()

# ✅ CORS (Laptop + Phone Safe)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.2:5173",   # 🔥 REPLACE with your laptop IP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create tables
Base.metadata.create_all(bind=engine)

# ✅ Include all routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(admin_router.router)
app.include_router(teacher_router.router)
app.include_router(attendance_router.router)
app.include_router(analytics_router.router)
app.include_router(ws_router.router)

@app.get("/")
def root():
    return {"message": "Attendance System API"}