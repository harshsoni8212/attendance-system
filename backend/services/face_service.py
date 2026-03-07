import boto3
import os
from fastapi import HTTPException

rekognition = boto3.client(
    "rekognition",
    region_name=os.getenv("AWS_REGION")
)

COLLECTION_ID = os.getenv("REKOGNITION_COLLECTION")


def index_student_face(image_bytes, student_id: int):
    try:
        response = rekognition.index_faces(
            CollectionId=COLLECTION_ID,
            Image={"Bytes": image_bytes},
            ExternalImageId=str(student_id),
            DetectionAttributes=["DEFAULT"]
        )

        if not response["FaceRecords"]:
            raise HTTPException(
                status_code=400,
                detail="No face detected in image"
            )

        return response["FaceRecords"][0]["Face"]["FaceId"]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face indexing failed: {str(e)}"
        )


def search_student_face(image_bytes):
    try:
        response = rekognition.search_faces_by_image(
            CollectionId=COLLECTION_ID,
            Image={"Bytes": image_bytes},
            MaxFaces=1,
            FaceMatchThreshold=90
        )

        if not response["FaceMatches"]:
            return None

        return response["FaceMatches"][0]["Face"]["FaceId"]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face search failed: {str(e)}"
        )