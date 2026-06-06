import base64
import numpy as np
import os
import logging
from typing import Optional, Tuple, List, Dict

# Setup logger
logger = logging.getLogger("face_service")

# Try to import face_recognition and cv2
try:
    import face_recognition
    import cv2
    HAS_FACE_RECOGNITION = True
    logger.info("face_recognition and OpenCV loaded successfully.")
except Exception as e:
    HAS_FACE_RECOGNITION = False
    logger.warning(f"face_recognition import failed ({e}), will use DeepFace fallback.")

# Try to import DeepFace
try:
    from deepface import DeepFace
    HAS_DEEPFACE = True
    logger.info("DeepFace loaded successfully.")
except Exception as e:
    HAS_DEEPFACE = False
    logger.error(f"DeepFace import failed ({e}). Face functionality will be mocked.")

class FaceService:
    @staticmethod
    def _mock_encoding(image_path: str) -> bytes:
        """Generate a deterministic mock encoding based on filename hash."""
        mock_hash = hash(os.path.basename(image_path)) % 1000
        np.random.seed(mock_hash)
        mock_encoding = np.random.uniform(-0.1, 0.1, 128).astype(np.float64)
        return mock_encoding.tobytes()

    @staticmethod
    def get_face_encoding_from_image(image_path: str) -> Optional[bytes]:
            if HAS_FACE_RECOGNITION:
                try:
                    image = face_recognition.load_image_file(image_path)
                    encodings = face_recognition.face_encodings(image)
                    if encodings:
                        return encodings[0].tobytes()
                    logger.warning(f\"No faces found with face_recognition in {image_path}\")
                    return None
                except Exception as e:
                    logger.error(f\"face_recognition error: {e}\")
                    return None
            elif HAS_DEEPFACE:
                try:
                    objs = DeepFace.represent(img_path=image_path, model_name=\"Facenet\", enforce_detection=False)
                    if objs:
                        embedding = np.array(objs[0][\"embedding\"]).astype(np.float64)
                        return embedding.tobytes()
                    logger.warning(f\"DeepFace returned empty embedding for {image_path}\")
                    return None
                except Exception as e:
                    logger.error(f\"DeepFace error: {e}\")
                    return None
            else:
                logger.info(\"Using mock face encoding.\")
                return FaceService._mock_encoding(image_path)

    @staticmethod
    def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
        """
        Decodes a base64 string (often prefixed with data:image/jpeg;base64,)
        into an OpenCV/NumPy BGR image.
        """
        try:
            # Strip prefix if present
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            
            img_data = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_data, np.uint8)
            
            if not HAS_FACE_RECOGNITION:
                # Return dummy image
                return np.zeros((100, 100, 3), dtype=np.uint8)
                
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return None

    @staticmethod
    def recognize_face_from_frame(frame_bgr: np.ndarray, known_students: List[Dict]) -> Tuple[Optional[str], float]:
        """
        Takes a BGR video frame and a list of dictionary representations of known students:
        [{"student_id": "CS101", "name": "Alice", "encoding_bytes": b'...'}]
        
        Compares the detected face with the known student encodings.
        Returns (student_id, confidence) if a match is found within threshold, else (None, 0.0).
        """
        if not known_students:
            return None, 0.0

        if not HAS_FACE_RECOGNITION:
    if HAS_DEEPFACE:
        try:
            # Use DeepFace to get embedding for the frame
            # Convert frame to image file temporarily using cv2.imencode
            success, encoded_image = cv2.imencode('.jpg', frame_bgr)
            if not success:
                logger.error("Failed to encode frame for DeepFace.")
                return None, 0.0
            # Write to temporary in-memory buffer
            import io
            img_bytes = io.BytesIO(encoded_image.tobytes())
            # DeepFace expects a path or numpy array; we can pass the numpy array directly
            objs = DeepFace.represent(img_path=img_bytes, model_name="Facenet", enforce_detection=False)
            if not objs:
                logger.warning("DeepFace could not find a face in the frame.")
                return None, 0.0
            unknown_embedding = np.array(objs[0]["embedding"]).astype(np.float64)
        except Exception as e:
            logger.error(f"DeepFace error during frame representation: {e}")
            return None, 0.0
    else:
        logger.info("Using mock face encoding for frame.")
        unknown_embedding = FaceService._mock_encoding('frame')
    # Prepare known embeddings
    known_embeddings = []
    known_ids = []
    for student in known_students:
        if student["encoding_bytes"]:
            known_embeddings.append(np.frombuffer(student["encoding_bytes"], dtype=np.float64))
            known_ids.append(student["student_id"])
    if not known_embeddings:
        return None, 0.0
    # Compute distances (cosine similarity) between unknown and known
    distances = []
    for known in known_embeddings:
        # cosine distance = 1 - cosine similarity
        cos_sim = np.dot(unknown_embedding, known) / (np.linalg.norm(unknown_embedding) * np.linalg.norm(known) + 1e-6)
        distances.append(1 - cos_sim)
    best_idx = int(np.argmin(distances))
    best_distance = distances[best_idx]
    # Threshold for cosine distance; empirical value 0.4 works reasonably
    threshold = 0.4
    if best_distance <= threshold:
        confidence = float(max(0.0, 1.0 - (best_distance / threshold)))
        return known_ids[best_idx], confidence
    return None, 0.0

        try:
            # Convert OpenCV BGR to face_recognition RGB
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            
            # Find face locations and encodings in the frame
            face_locations = face_recognition.face_locations(frame_rgb)
            face_encodings = face_recognition.face_encodings(frame_rgb, face_locations)
            
            if not face_encodings:
                return None, 0.0

            # Deserialize known encodings
            known_encodings_list = []
            known_ids = []
            
            for student in known_students:
                if student["encoding_bytes"]:
                    encoding = np.frombuffer(student["encoding_bytes"], dtype=np.float64)
                    known_encodings_list.append(encoding)
                    known_ids.append(student["student_id"])

            if not known_encodings_list:
                return None, 0.0

            # Match first detected face in the frame
            unknown_encoding = face_encodings[0]
            
            # Calculate face distances (lower = closer match)
            face_distances = face_recognition.face_distance(known_encodings_list, unknown_encoding)
            
            if len(face_distances) == 0:
                return None, 0.0

            # Find best match
            best_match_index = np.argmin(face_distances)
            best_distance = face_distances[best_match_index]
            
            # Set a typical cutoff threshold (lower means stricter, e.g., settings.FACE_RECOGNITION_THRESHOLD)
            # Standard dlib threshold is 0.6. We'll use 0.5 for extra confidence.
            threshold = 0.50
            
            if best_distance <= threshold:
                matched_id = known_ids[best_match_index]
                # Map face distance to confidence score: 0.0 distance -> 100% confidence, 0.5 distance -> 50% confidence
                confidence = float(max(0.0, 1.0 - (best_distance / threshold * 0.5)))
                return matched_id, confidence
                
            return None, 0.0
            
        except Exception as e:
            logger.error(f"Error recognizing face from frame: {e}")
            return None, 0.0
