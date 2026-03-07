from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/attendance")
async def attendance_ws(websocket: WebSocket):

    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive()   # keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)