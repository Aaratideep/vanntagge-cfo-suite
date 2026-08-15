import requests
import json
import os

TARGET_URL = os.environ.get("TARGET_URL", "http://localhost:4000/api")

def test_leads_update_and_delete():
    """Test update and delete operations on a lead"""
    url = f"{TARGET_URL}/leads"
    headers = {"Content-Type": "application/json"}

    # 1. Create a lead to manipulate
    payload = {
        "companyName": "Delete Corp",
        "contactPerson": "Bob Brown",
        "email": "bob@deletecorp.com",
        "phone": "1234567890",
        "industry": "Finance",
        "businessType": "B2C",
        "leadSource": "Referral",
        "expectedRevenue": 10000,
        "priority": "LOW",
        "status": "NEW"
    }
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    assert response.status_code in [200, 201], f"Create failed: {response.status_code} {response.text}"
    lead_id = response.json()["id"]

    # 2. Update the lead
    update_payload = {"status": "QUALIFIED", "priority": "HIGH"}
    response = requests.put(f"{url}/{lead_id}", data=json.dumps(update_payload), headers=headers)
    assert response.status_code == 200, f"Update failed: {response.status_code}"
    updated = response.json()
    assert updated["status"] == "QUALIFIED"
    assert updated["priority"] == "HIGH"

    # 3. Delete the lead
    response = requests.delete(f"{url}/{lead_id}")
    assert response.status_code == 200, f"Delete failed: {response.status_code}"

    # 4. Verify it is gone - returns empty body or null when not found
    response = requests.get(f"{url}/{lead_id}")
    assert response.status_code == 200
    body = response.text.strip()
    assert body == "" or body == "null", f"Lead should be gone but got: {body}"

    print("Lead update and delete test passed!")

if __name__ == "__main__":
    test_leads_update_and_delete()
