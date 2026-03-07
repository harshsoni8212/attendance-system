from database import SessionLocal
from models import User
from auth.utils import hash_password

ADMIN_EMAIL = "admin@attendance.com"
ADMIN_PASSWORD = "Admin@123"
ADMIN_NAME = "Super Admin"


def create_admin():
    db = SessionLocal()

    try:
        existing_admin = db.query(User).filter(
            User.email == ADMIN_EMAIL
        ).first()

        if existing_admin:
            print("⚠ Admin already exists.")
            return

        admin_user = User(
            badge_number=None,   # explicit
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password=hash_password(ADMIN_PASSWORD),
            role="admin"
        )

        db.add(admin_user)
        db.commit()
        print("✅ Admin created successfully.")

    except Exception as e:
        db.rollback()
        print("❌ Error creating admin:", e)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()