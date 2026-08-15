import requests
import json
import os

# TestSprite injects TARGET_URL, but we fallback to our serveo URL for dev
TARGET_URL = os.environ.get("TARGET_URL", "https://8c03d64fa18867d8-152-58-16-102.serveousercontent.com/api")

def test_leads_lifecycle():
    # 1. Create a lead
    url = f"{TARGET_URL}/leads"
    payload = {
        "companyName": "Test Corp",
        "contactPerson": "Alice Smith",
        "email": "alice@testcorp.com",
        "phone": "9876543210",
        "industry": "Software",
        "businessType": "B2B",
        "leadSource": "Direct",
        "expectedRevenue": 50000,
        "priority": "HIGH",
        "status": "NEW"
    }
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    assert response.status_code == 201 or response.status_code == 200
    lead = response.json()
    assert lead["companyName"] == "Test Corp"
    lead_id = lead["id"]
    
    # 2. Get all leads
    response = requests.get(url)
    assert response.status_code == 200
    leads = response.json()
    assert len(leads) > 0
    
    # 3. Get single lead
    response = requests.get(f"{url}/{lead_id}")
    assert response.status_code == 200
    assert response.json()["id"] == lead_id
    
    print("Leads lifecycle test passed successfully!")

if __name__ == "__main__":
    test_leads_lifecycle()
