import random

def generate_badge(role: str):
    prefix_map = {
        "student": "STU",
        "teacher": "TCH",
        "admin": "ADM"
    }

    prefix = prefix_map.get(role, "USR")
    number = random.randint(1000, 9999)

    return f"{prefix}-{number}"