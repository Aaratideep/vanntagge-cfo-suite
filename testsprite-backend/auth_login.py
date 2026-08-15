import requests
import json
import os

# TestSprite injects TARGET_URL, but we fallback to our serveo URL for dev
TARGET_URL = os.environ.get("TARGET_URL", "https://8c03d64fa18867d8-152-58-16-102.serveousercontent.com/api")

def test_login():
    url = f"{TARGET_URL}/auth/login"
    payload = {"email": "sarah.jenkins@vanntagge.com", "password": "anypassword"}
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert "access_token" in data
    print("Login test passed successfully!")

if __name__ == "__main__":
    test_login()
