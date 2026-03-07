import boto3
import os

rekognition = boto3.client(
    "rekognition",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)

COLLECTION_ID = os.getenv("REKOGNITION_COLLECTION")

def create_collection():
    try:
        rekognition.create_collection(CollectionId=COLLECTION_ID)
        print("Collection created")
    except rekognition.exceptions.ResourceAlreadyExistsException:
        print("Collection already exists")
