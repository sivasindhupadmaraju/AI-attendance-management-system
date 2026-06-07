import base64
import numpy as np
import os
import logging
from typing import Optional, Tuple, List, Dict
import io

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
        """Return a face encoding for an image file using the available backend."""
        if HAS_FACE_RECOGNITION:
            try:
                image = face_recognition.load_image_file(image_path)
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    return encodings[0].tobytes()
                logger.warning(f"No faces found with face_recognition in {image_path}")
                return None
            except Exception as e:
                logger.error(f"face_recognition error: {e}")
                return None
        elif HAS_DEEPFACE:
            try:
                objs = DeepFace.represent(img_path=image_path, model_name="Facenet", enforce_detection=False)
                if objs:
                    embedding = np.array(objs[0]["embedding"]).astype(np.float64)
                    return embedding.tobytes()
                logger.warning(f"DeepFace returned empty embedding for {image_path}")
                return None
            except Exception as e:
                logger.error(f"DeepFace error: {e}")
                return None
        else:
            logger.info("Using mock face encoding.")
            return FaceService._mock_encoding(image_path)

    @staticmethod
    def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
        """Decode a base64-encoded image into a NumPy BGR array."""
        try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            img_data = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_data, np.uint8)
            if not HAS_FACE_RECOGNITION:
                # Return dummy image when face libraries are unavailable
                return np.zeros((100, 100, 3), dtype=np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return None

    @staticmethod
    def _prepare_known_embeddings(known_students: List[Dict]) -> Tuple[List[np.ndarray], List[str]]:
        """Extract embeddings and IDs from known_students list."""
        embeddings: List[np.ndarray] = []
        ids: List[str] = []
        for student in known_students:
            enc_bytes = student.get("encoding_bytes")
            if enc_bytes:
                embeddings.append(np.frombuffer(enc_bytes, dtype=np.float64))
                ids.append(student.get("student_id"))
        return embeddings, ids

    @staticmethod
    def recognize_face_from_frame(frame_bgr: np.ndarray, known_students: List[Dict]) -> Tuple[Optional[str], float]:
        """Match a video frame against known student embeddings.

        Returns a tuple of (student_id, confidence). Confidence is 0‑1 where 1 means a perfect match.
        """
        if not known_students:
            return None, 0.0

        # Prepare known embeddings
        known_embeddings, known_ids = FaceService._prepare_known_embeddings(known_students)
        if not known_embeddings:
            return None, 0.0

        # Obtain unknown embedding using the available backend
        if HAS_FACE_RECOGNITION:
            try:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                locations = face_recognition.face_locations(frame_rgb)
                encodings = face_recognition.face_encodings(frame_rgb, locations)
                if not encodings:
                    return None, 0.0
                unknown_embedding = encodings[0]
            except Exception as e:
                logger.error(f"face_recognition frame error: {e}")
                return None, 0.0
        elif HAS_DEEPFACE:
            try:
                success, encoded_img = cv2.imencode('.jpg', frame_bgr)
                if not success:
                    logger.error("Failed to encode frame for DeepFace.")
                    return None, 0.0
                img_bytes = io.BytesIO(encoded_img.tobytes())
                objs = DeepFace.represent(img_path=img_bytes, model_name="Facenet", enforce_detection=False)
                if not objs:
                    logger.warning("DeepFace could not find a face in the frame.")
                    return None, 0.0
                unknown_embedding = np.array(objs[0]["embedding"]).astype(np.float64)
            except Exception as e:
                logger.error(f"DeepFace frame error: {e}")
                return None, 0.0
        else:
            logger.info("Using mock encoding for frame.")
            unknown_embedding = np.frombuffer(FaceService._mock_encoding('frame'), dtype=np.float64)

        # Compute cosine distances
        distances: List[float] = []
        for known in known_embeddings:
            cos_sim = np.dot(unknown_embedding, known) / (
                np.linalg.norm(unknown_embedding) * np.linalg.norm(known) + 1e-6
            )
            distances.append(1 - cos_sim)
        best_idx = int(np.argmin(distances))
        best_distance = distances[best_idx]
        # Threshold (empirically chosen)
        threshold = 0.4
        if best_distance <= threshold:
            confidence = float(max(0.0, 1.0 - (best_distance / threshold)))
            return known_ids[best_idx], confidence
        return None, 0.0
