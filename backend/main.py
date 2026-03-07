from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

from routers import auth_router, user_router, admin_router
from routers import teacher_router
from routers import attendance_router
from routers import analytics_router
from routers import ws_router


# ✅ Create app FIRST
app = FastAPI()

# ✅ Create tables
Base.metadata.create_all(bind=engine)

# ✅ Include all routers AFTER app creation
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(admin_router.router)
app.include_router(teacher_router.router)
app.include_router(attendance_router.router)
app.include_router(analytics_router.router)
app.include_router(ws_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Attendance System API"}