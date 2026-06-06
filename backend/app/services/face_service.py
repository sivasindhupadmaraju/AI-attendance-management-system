import base64
import numpy as np
import os
import logging
from typing import Optional, Tuple, List, Dict

# Setup logging
logger = logging.getLogger("face_service")

# Try to import face_recognition and cv2
try:
    import face_recognition
    import cv2
    HAS_FACE_RECOGNITION = True
    logger.info("face_recognition and OpenCV loaded successfully.")
except ImportError as e:
    HAS_FACE_RECOGNITION = False
    logger.warning(f"Failed to import face_recognition or OpenCV: {e}. Running in Developer Mock Mode.")

class FaceService:
    @staticmethod
    def get_face_encoding_from_image(image_path: str) -> Optional[bytes]:
        """
        Loads an image from disk and extracts the 128-d face encoding vector.
        Returns the vector serialized as bytes, or None if no face is detected.
        """
        if not HAS_FACE_RECOGNITION:
            logger.info(f"Mock encoding face image for path: {image_path}")
            # Generate a stable mock embedding based on filename hash to keep mocks deterministic
            mock_hash = hash(os.path.basename(image_path)) % 1000
            np.random.seed(mock_hash)
            mock_encoding = np.random.uniform(-0.1, 0.1, 128).astype(np.float64)
            return mock_encoding.tobytes()

        try:
            # Load the image
            image = face_recognition.load_image_file(image_path)
            # Find face encodings
            encodings = face_recognition.face_encodings(image)
            
            if not encodings:
                logger.warning(f"No faces found in image: {image_path}")
                return None
                
            # Return the first face encoding serialized to bytes
            return encodings[0].tobytes()
        except Exception as e:
            logger.error(f"Error extracting face encoding: {e}")
            return None

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
            # In developer mock mode: randomly match one of the student IDs for demo purposes, or return first
            # We will use mock mode matching logic: match the first student if students exist, or "unknown" if list empty.
            # To simulate, if known_students has elements, return the first student with high confidence.
            logger.info("Developer Mock Mode: Simulating face match.")
            import random
            if random.random() < 0.2:
                return None, 0.0  # Simulate 20% unknown
            student = random.choice(known_students)
            return student["student_id"], 0.92

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
