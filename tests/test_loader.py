from unittest.mock import MagicMock
import pytest
from extract import bigquery_loader as loader

@pytest.fixture
def client(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(loader, "get_client", lambda *a: client)
    for name in ["ensure_dataset", "ensure_activities_table", "ensure_metadata_table"]:
        monkeypatch.setattr(loader, name, lambda *a: None)
    checkpoint = MagicMock()
    monkeypatch.setattr(loader, "upsert_metadata", checkpoint)
    return client, checkpoint

def test_partial_failure_never_advances_checkpoint(client):
    db, checkpoint = client
    db.insert_rows_json.return_value = [{"index": 1, "errors": [{"reason": "invalid"}]}]
    with pytest.raises(RuntimeError, match="checkpoint unchanged"):
        loader.load_activities("project", "dataset", [{"id": 1}, {"id": 2}], last_run_at=100)
    checkpoint.assert_not_called()

def test_success_records_checkpoint_and_ingestion_time(client):
    db, checkpoint = client
    db.insert_rows_json.return_value = []
    assert loader.load_activities("project", "dataset", [{"id": 1}], last_run_at=100) == (1, 0)
    checkpoint.assert_called_once_with(db, "project", "dataset", 100)
    rows = db.insert_rows_json.call_args.args[1]
    assert rows[0]["_loaded_at"]
    assert db.insert_rows_json.call_args.kwargs["row_ids"][0].startswith("1:")

def test_no_rows_can_checkpoint_without_insert(client):
    db, checkpoint = client
    assert loader.load_activities("p", "d", [], last_run_at=50) == (0, 0)
    db.insert_rows_json.assert_not_called()
    checkpoint.assert_called_once()
