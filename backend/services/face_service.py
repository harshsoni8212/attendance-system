import boto3
import os
from fastapi import HTTPException

rekognition = boto3.client(
    "rekognition",
    region_name=os.getenv("AWS_REGION")
)

COLLECTION_ID = os.getenv("REKOGNITION_COLLECTION")


# ============================
# ENROLL / INDEX STUDENT FACE
# ============================
def index_student_face(image_bytes, student_id: int):
    try:
        response = rekognition.index_faces(
            CollectionId=COLLECTION_ID,
            Image={"Bytes": image_bytes},
            ExternalImageId=str(student_id),
            DetectionAttributes=["DEFAULT"]
        )

        face_records = response.get("FaceRecords", [])

        if not face_records:
            raise HTTPException(
                status_code=400,
                detail="No face detected in image"
            )

        return face_records[0]["Face"]["FaceId"]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face indexing failed: {str(e)}"
        )


# ============================
# SEARCH / MATCH STUDENT FACE
# ============================
def search_student_face(image_bytes):
    try:
        response = rekognition.search_faces_by_image(
            CollectionId=COLLECTION_ID,
            Image={"Bytes": image_bytes},
            MaxFaces=1,
            FaceMatchThreshold=80   # 🔥 lowered from 90 to 80
        )

        face_matches = response.get("FaceMatches", [])

        if not face_matches:
            return None

        best_match = face_matches[0]

        # Optional debug logs
        print("Matched FaceId:", best_match["Face"]["FaceId"])
        print("Similarity:", best_match["Similarity"])

        return best_match["Face"]["FaceId"]

    except rekognition.exceptions.InvalidParameterException:
        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face search failed: {str(e)}"
        )


# ============================
# DELETE OLD FACE FROM COLLECTION
# ============================
def delete_student_face(face_id: str):
    try:
        rekognition.delete_faces(
            CollectionId=COLLECTION_ID,
            FaceIds=[face_id]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete old face: {str(e)}"
        )