import pytest


@pytest.mark.asyncio
async def test_compliance_report_empty_range(client):
    response = await client.get("/api/v1/reports/compliance?from=2020-01-01&to=2020-12-31")
    assert response.status_code == 200
    data = response.json()
    assert data["report_period"]["from"] == "2020-01-01"
    assert data["report_period"]["to"] == "2020-12-31"
    assert "summary" in data
    assert "assets" in data
    assert "assignments" in data
    assert "maintenance" in data
    assert "disposals" in data


@pytest.mark.asyncio
async def test_compliance_report_with_data(client):
    # Create asset
    create_r = await client.post("/api/v1/assets", json={
        "name": "Compliance Asset", "asset_tag": "COMP-001", "asset_type": "hardware", "status": "active"
    })
    asset_id = create_r.json()["id"]

    # Assign it
    await client.post(f"/api/v1/assets/{asset_id}/assign", json={
        "assigned_to_name": "Test User"
    })

    # Report covering a wide range
    response = await client.get("/api/v1/reports/compliance?from=2020-01-01&to=2030-12-31")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_assets_in_inventory"] >= 1
    assert data["summary"]["assignments_in_period"] >= 1
    asset_tags = [a["asset_tag"] for a in data["assets"]]
    assert "COMP-001" in asset_tags


@pytest.mark.asyncio
async def test_compliance_report_missing_params(client):
    response = await client.get("/api/v1/reports/compliance?from=2020-01-01")
    assert response.status_code == 422
