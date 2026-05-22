import io
import pytest


@pytest.mark.asyncio
async def test_create_asset(client):
    response = await client.post("/api/v1/assets", json={
        "name": "MacBook Pro M3",
        "asset_tag": "ASSET-001",
        "asset_type": "hardware",
        "status": "active",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "MacBook Pro M3"
    assert data["asset_tag"] == "ASSET-001"
    assert data["asset_type"] == "hardware"
    assert data["status"] == "active"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_asset_duplicate_tag(client):
    payload = {"name": "Laptop A", "asset_tag": "DUP-001", "asset_type": "hardware"}
    await client.post("/api/v1/assets", json=payload)
    response = await client.post("/api/v1/assets", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_assets_empty(client):
    response = await client.get("/api/v1/assets")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_assets_with_data(client):
    for i in range(3):
        await client.post("/api/v1/assets", json={
            "name": f"Asset {i}",
            "asset_tag": f"TAG-{i:03d}",
            "asset_type": "hardware",
        })
    response = await client.get("/api/v1/assets")
    assert response.status_code == 200
    assert response.json()["total"] == 3


@pytest.mark.asyncio
async def test_list_assets_search(client):
    await client.post("/api/v1/assets", json={
        "name": "Dell Monitor", "asset_tag": "MON-001", "asset_type": "hardware"
    })
    await client.post("/api/v1/assets", json={
        "name": "Adobe License", "asset_tag": "LIC-001", "asset_type": "license"
    })
    response = await client.get("/api/v1/assets?search=dell")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Dell Monitor"


@pytest.mark.asyncio
async def test_list_assets_filter_type(client):
    await client.post("/api/v1/assets", json={
        "name": "MacBook", "asset_tag": "HW-001", "asset_type": "hardware"
    })
    await client.post("/api/v1/assets", json={
        "name": "Zoom License", "asset_tag": "LIC-002", "asset_type": "license"
    })
    response = await client.get("/api/v1/assets?asset_type=license")
    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.asyncio
async def test_get_asset(client):
    create = await client.post("/api/v1/assets", json={
        "name": "iPad", "asset_tag": "IPAD-001", "asset_type": "hardware"
    })
    asset_id = create.json()["id"]
    response = await client.get(f"/api/v1/assets/{asset_id}")
    assert response.status_code == 200
    assert response.json()["id"] == asset_id


@pytest.mark.asyncio
async def test_get_asset_not_found(client):
    response = await client.get("/api/v1/assets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_asset(client):
    create = await client.post("/api/v1/assets", json={
        "name": "Old Name", "asset_tag": "UPD-001", "asset_type": "hardware"
    })
    asset_id = create.json()["id"]
    response = await client.put(f"/api/v1/assets/{asset_id}", json={"name": "New Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_asset(client):
    create = await client.post("/api/v1/assets", json={
        "name": "ToDelete", "asset_tag": "DEL-001", "asset_type": "hardware"
    })
    asset_id = create.json()["id"]
    response = await client.delete(f"/api/v1/assets/{asset_id}")
    assert response.status_code == 204
    get_response = await client.get(f"/api/v1/assets/{asset_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_stats_empty(client):
    response = await client.get("/api/v1/assets/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_assets"] == 0
    assert data["active_assets"] == 0
    assert data["recently_added"] == []


@pytest.mark.asyncio
async def test_stats_with_data(client):
    await client.post("/api/v1/assets", json={
        "name": "Server", "asset_tag": "SRV-001", "asset_type": "hardware", "status": "active"
    })
    await client.post("/api/v1/assets", json={
        "name": "Windows License", "asset_tag": "WIN-001", "asset_type": "license", "status": "active"
    })
    response = await client.get("/api/v1/assets/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_assets"] == 2
    assert data["hardware_count"] == 1
    assert data["license_count"] == 1


@pytest.mark.asyncio
async def test_assign_and_return_asset(client):
    create = await client.post("/api/v1/assets", json={
        "name": "Laptop", "asset_tag": "LAP-001", "asset_type": "hardware"
    })
    asset_id = create.json()["id"]

    assign_resp = await client.post(f"/api/v1/assets/{asset_id}/assign", json={
        "assigned_to_name": "Alice Smith",
        "assigned_to_email": "alice@example.com",
    })
    assert assign_resp.status_code == 201
    assert assign_resp.json()["assigned_to_name"] == "Alice Smith"
    assert assign_resp.json()["returned_at"] is None

    double_assign = await client.post(f"/api/v1/assets/{asset_id}/assign", json={
        "assigned_to_name": "Bob Jones"
    })
    assert double_assign.status_code == 409

    return_resp = await client.post(f"/api/v1/assets/{asset_id}/return")
    assert return_resp.status_code == 200
    assert return_resp.json()["returned_at"] is not None


@pytest.mark.asyncio
async def test_maintenance_log(client):
    create = await client.post("/api/v1/assets", json={
        "name": "Printer", "asset_tag": "PRT-001", "asset_type": "hardware"
    })
    asset_id = create.json()["id"]

    maint_resp = await client.post(f"/api/v1/assets/{asset_id}/maintenance", json={
        "maintenance_type": "repair",
        "description": "Fixed paper jam",
        "performed_by": "IT Team",
        "cost": 50.0,
    })
    assert maint_resp.status_code == 201
    assert maint_resp.json()["description"] == "Fixed paper jam"

    list_resp = await client.get(f"/api/v1/assets/{asset_id}/maintenance")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


@pytest.mark.asyncio
async def test_depreciation(client):
    create = await client.post("/api/v1/assets", json={
        "name": "Server Rack",
        "asset_tag": "RACK-001",
        "asset_type": "hardware",
        "purchase_price": 10000.0,
        "purchase_date": "2022-01-01",
    })
    asset_id = create.json()["id"]

    depr_resp = await client.get(f"/api/v1/assets/{asset_id}/depreciation?useful_life_years=5")
    assert depr_resp.status_code == 200
    data = depr_resp.json()
    assert data["purchase_price"] == 10000.0
    assert data["annual_depreciation"] == 2000.0
    assert data["book_value"] >= 0


@pytest.mark.asyncio
async def test_depreciation_missing_fields(client):
    create = await client.post("/api/v1/assets", json={
        "name": "No Price", "asset_tag": "NP-001", "asset_type": "software"
    })
    asset_id = create.json()["id"]
    response = await client.get(f"/api/v1/assets/{asset_id}/depreciation")
    assert response.status_code == 422


# ── Export ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_export_csv_empty(client):
    response = await client.get("/api/v1/assets/export")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    lines = response.text.strip().splitlines()
    assert len(lines) == 1  # header only
    assert "asset_tag" in lines[0]


@pytest.mark.asyncio
async def test_export_csv_with_data(client):
    await client.post("/api/v1/assets", json={
        "name": "Export Test", "asset_tag": "EXP-001", "asset_type": "hardware", "status": "active"
    })
    response = await client.get("/api/v1/assets/export")
    assert response.status_code == 200
    lines = response.text.strip().splitlines()
    assert len(lines) == 2  # header + 1 asset
    assert "EXP-001" in lines[1]
    assert "Export Test" in lines[1]


# ── Import ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_import_csv_success(client):
    csv_content = (
        "asset_tag,name,serial_number,asset_type,status,assigned_to,"
        "purchase_date,purchase_price,warranty_expiry,notes\n"
        "IMP-001,Imported Laptop,,hardware,active,,,,,\n"
        "IMP-002,Imported License,,license,active,,,,,\n"
    )
    files = {"file": ("assets.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    response = await client.post("/api/v1/assets/import", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["created"] == 2
    assert data["skipped"] == 0
    assert data["errors"] == []


@pytest.mark.asyncio
async def test_import_csv_duplicate_tag(client):
    await client.post("/api/v1/assets", json={
        "name": "Existing", "asset_tag": "DUP-IMP-001", "asset_type": "hardware"
    })
    csv_content = (
        "asset_tag,name,asset_type\n"
        "DUP-IMP-001,Duplicate,hardware\n"
        "NEW-IMP-001,New Asset,hardware\n"
    )
    files = {"file": ("assets.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    response = await client.post("/api/v1/assets/import", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["created"] == 1
    assert data["skipped"] == 1
    assert len(data["errors"]) == 1


@pytest.mark.asyncio
async def test_import_csv_invalid_file_type(client):
    files = {"file": ("data.txt", io.BytesIO(b"not a csv"), "text/plain")}
    response = await client.post("/api/v1/assets/import", files=files)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_import_csv_missing_required_fields(client):
    csv_content = "asset_tag,name\n,Missing Name\nMissing Tag,\n"
    files = {"file": ("assets.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    response = await client.post("/api/v1/assets/import", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["created"] == 0
    assert data["skipped"] == 2


# ── Refresh Predictions ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_predictions_empty(client):
    response = await client.get("/api/v1/assets/refresh-predictions")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_refresh_predictions_with_hardware(client):
    await client.post("/api/v1/assets", json={
        "name": "Old Server", "asset_tag": "SRV-OLD", "asset_type": "hardware",
        "purchase_date": "2019-01-01",
    })
    await client.post("/api/v1/assets", json={
        "name": "New Laptop", "asset_tag": "LAP-NEW", "asset_type": "hardware",
        "purchase_date": "2024-01-01",
    })
    # non-hardware should not appear
    await client.post("/api/v1/assets", json={
        "name": "Some Software", "asset_tag": "SW-001", "asset_type": "software",
    })
    response = await client.get("/api/v1/assets/refresh-predictions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all("refresh_score" in item for item in data)
    assert all("reasons" in item for item in data)
    # Old server should have a higher refresh score than the new laptop
    old_score = next(i["refresh_score"] for i in data if i["asset_tag"] == "SRV-OLD")
    new_score = next(i["refresh_score"] for i in data if i["asset_tag"] == "LAP-NEW")
    assert old_score > new_score


# ── License Waste ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_license_waste_unassigned(client):
    await client.post("/api/v1/assets", json={
        "name": "Unused License", "asset_tag": "LIC-UNUSED", "asset_type": "license"
    })
    response = await client.get("/api/v1/assets/license-waste?threshold=100")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["asset_tag"] == "LIC-UNUSED"
    assert data[0]["utilization_pct"] == 0
    assert data[0]["is_assigned"] is False


@pytest.mark.asyncio
async def test_license_waste_excludes_assigned(client):
    create = await client.post("/api/v1/assets", json={
        "name": "Assigned License", "asset_tag": "LIC-ASGN", "asset_type": "license"
    })
    asset_id = create.json()["id"]
    await client.post(f"/api/v1/assets/{asset_id}/assign", json={
        "assigned_to_name": "User One"
    })
    # threshold=50 means show assets < 50% utilization; assigned = 100%, so excluded
    response = await client.get("/api/v1/assets/license-waste?threshold=50")
    assert response.status_code == 200
    data = response.json()
    assert all(item["asset_tag"] != "LIC-ASGN" for item in data)


# ── QR Code ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_qr_code(client):
    create = await client.post("/api/v1/assets", json={
        "name": "QR Asset", "asset_tag": "QR-001", "asset_type": "hardware"
    })
    asset_id = create.json()["id"]
    response = await client.get(f"/api/v1/assets/{asset_id}/qr")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    # PNG magic bytes: \x89PNG
    assert response.content[:4] == b"\x89PNG"


@pytest.mark.asyncio
async def test_qr_code_not_found(client):
    response = await client.get("/api/v1/assets/00000000-0000-0000-0000-000000000000/qr")
    assert response.status_code == 404
