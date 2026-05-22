import pytest


@pytest.mark.asyncio
async def test_create_purchase_request(client):
    response = await client.post("/api/v1/procurement/", json={
        "title": "MacBook Pro M3",
        "requested_by": "Alice Smith",
        "quantity": 2,
        "estimated_cost": 2599.00,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "MacBook Pro M3"
    assert data["status"] == "pending"
    assert data["quantity"] == 2


@pytest.mark.asyncio
async def test_list_purchase_requests(client):
    await client.post("/api/v1/procurement/", json={
        "title": "Req A", "requested_by": "Bob"
    })
    await client.post("/api/v1/procurement/", json={
        "title": "Req B", "requested_by": "Carol"
    })
    response = await client.get("/api/v1/procurement/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_list_purchase_requests_filter_status(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "Req A", "requested_by": "Bob"
    })
    pr_id = create_r.json()["id"]
    # Approve it
    await client.post(f"/api/v1/procurement/{pr_id}/transition", json={"new_status": "approved"})

    await client.post("/api/v1/procurement/", json={"title": "Req B", "requested_by": "Carol"})

    approved = await client.get("/api/v1/procurement/?status=approved")
    assert len(approved.json()) == 1
    pending = await client.get("/api/v1/procurement/?status=pending")
    assert len(pending.json()) == 1


@pytest.mark.asyncio
async def test_get_purchase_request(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "Single PR", "requested_by": "Dave"
    })
    pr_id = create_r.json()["id"]
    response = await client.get(f"/api/v1/procurement/{pr_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Single PR"


@pytest.mark.asyncio
async def test_get_purchase_request_not_found(client):
    response = await client.get("/api/v1/procurement/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_transition_pending_to_approved(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "Transition Test", "requested_by": "Eve"
    })
    pr_id = create_r.json()["id"]
    response = await client.post(f"/api/v1/procurement/{pr_id}/transition", json={
        "new_status": "approved"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_transition_full_workflow(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "Full Workflow", "requested_by": "Frank"
    })
    pr_id = create_r.json()["id"]

    for expected in ["approved", "ordered", "received"]:
        prev = {"approved": "pending", "ordered": "approved", "received": "ordered"}[expected]
        r = await client.post(f"/api/v1/procurement/{pr_id}/transition", json={"new_status": expected})
        assert r.status_code == 200
        assert r.json()["status"] == expected

    # Cannot transition from received
    r = await client.post(f"/api/v1/procurement/{pr_id}/transition", json={"new_status": "cancelled"})
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_invalid_transition(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "Bad Transition", "requested_by": "Grace"
    })
    pr_id = create_r.json()["id"]
    # Cannot jump from pending to received
    response = await client.post(f"/api/v1/procurement/{pr_id}/transition", json={
        "new_status": "received"
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_cancel_purchase_request(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "To Cancel", "requested_by": "Henry"
    })
    pr_id = create_r.json()["id"]
    response = await client.post(f"/api/v1/procurement/{pr_id}/transition", json={
        "new_status": "cancelled"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_update_purchase_request(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "Old Title", "requested_by": "Iris"
    })
    pr_id = create_r.json()["id"]
    response = await client.put(f"/api/v1/procurement/{pr_id}", json={"title": "New Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


@pytest.mark.asyncio
async def test_delete_purchase_request(client):
    create_r = await client.post("/api/v1/procurement/", json={
        "title": "To Delete", "requested_by": "Jack"
    })
    pr_id = create_r.json()["id"]
    delete_r = await client.delete(f"/api/v1/procurement/{pr_id}")
    assert delete_r.status_code == 204
    get_r = await client.get(f"/api/v1/procurement/{pr_id}")
    assert get_r.status_code == 404
