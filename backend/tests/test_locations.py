import pytest


@pytest.mark.asyncio
async def test_create_location(client):
    response = await client.post("/api/v1/locations/", json={
        "name": "HQ - Floor 2",
        "building": "Main",
        "floor": "2",
        "room": "Server Room",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "HQ - Floor 2"
    assert data["building"] == "Main"


@pytest.mark.asyncio
async def test_list_locations(client):
    await client.post("/api/v1/locations/", json={"name": "Loc A"})
    await client.post("/api/v1/locations/", json={"name": "Loc B"})
    response = await client.get("/api/v1/locations/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_update_location(client):
    create = await client.post("/api/v1/locations/", json={"name": "Old Loc"})
    loc_id = create.json()["id"]
    response = await client.put(f"/api/v1/locations/{loc_id}", json={"name": "New Loc", "floor": "3"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Loc"
    assert response.json()["floor"] == "3"


@pytest.mark.asyncio
async def test_delete_location(client):
    create = await client.post("/api/v1/locations/", json={"name": "ToDelete"})
    loc_id = create.json()["id"]
    response = await client.delete(f"/api/v1/locations/{loc_id}")
    assert response.status_code == 204
    get_resp = await client.get(f"/api/v1/locations/{loc_id}")
    assert get_resp.status_code == 404
