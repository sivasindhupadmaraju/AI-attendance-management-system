import requests
import json

url = "http://127.0.0.1:8001/api/auth/login"
payload = {"email": "admin@attendance.com", "password": "admin123"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response Body:", response.text)
