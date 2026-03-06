"""
Strava API client with OAuth 2.0 authentication and incremental activity fetching.

Handles token storage in a local JSON file, automatic token refresh,
and paginated/incremental fetches of athlete activities.
"""

import json
import os
import time
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Default path for token storage (can be overridden via env)
TOKEN_FILE = os.environ.get("STRAVA_TOKEN_FILE", "strava_tokens.json")


def _session_with_retries(
    retries: int = 3,
    backoff_factor: float = 1.0,
    status_forcelist: tuple = (429, 500, 502, 503, 504),
) -> requests.Session:
    """
    Create a requests session with exponential backoff retries.

    Args:
        retries: Number of retries for failed requests.
        backoff_factor: Multiplier for delay between retries.
        status_forcelist: HTTP status codes that trigger a retry.

    Returns:
        Configured requests.Session.
    """
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def load_tokens(token_path: str | Path | None = None) -> dict[str, Any]:
    """
    Load stored OAuth tokens from the local JSON file.

    Args:
        token_path: Path to token file. Defaults to TOKEN_FILE.

    Returns:
        Dict with access_token, refresh_token, expires_at.

    Raises:
        FileNotFoundError: If token file does not exist.
        json.JSONDecodeError: If file is not valid JSON.
    """
    path = Path(token_path or TOKEN_FILE)
    if not path.exists():
        raise FileNotFoundError(f"Token file not found: {path}")
    with open(path, "r") as f:
        return json.load(f)


def save_tokens(
    access_token: str,
    refresh_token: str,
    expires_at: int,
    token_path: str | Path | None = None,
) -> None:
    """
    Persist OAuth tokens to the local JSON file.

    Args:
        access_token: Strava OAuth access token.
        refresh_token: Strava OAuth refresh token.
        expires_at: Unix timestamp when access_token expires.
        token_path: Path to token file. Defaults to TOKEN_FILE.
    """
    path = Path(token_path or TOKEN_FILE)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_at": expires_at,
            },
            f,
            indent=2,
        )


def refresh_access_token(
    client_id: str,
    client_secret: str,
    refresh_token: str,
    token_path: str | Path | None = None,
) -> str:
    """
    Exchange refresh_token for a new access_token and persist it.

    Args:
        client_id: Strava OAuth client ID.
        client_secret: Strava OAuth client secret.
        refresh_token: Current refresh token.
        token_path: Path to token file for saving new tokens.

    Returns:
        New access_token string.

    Raises:
        requests.HTTPError: If Strava token endpoint returns an error.
    """
    session = _session_with_retries()
    response = session.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
    )
    response.raise_for_status()
    data = response.json()
    access_token = data["access_token"]
    new_refresh = data.get("refresh_token", refresh_token)
    expires_at = data["expires_at"]
    save_tokens(access_token, new_refresh, expires_at, token_path)
    return access_token


def get_valid_access_token(
    client_id: str,
    client_secret: str,
    token_path: str | Path | None = None,
) -> str:
    """
    Return a valid access token, refreshing if expired (with 60s buffer).

    Args:
        client_id: Strava OAuth client ID.
        client_secret: Strava OAuth client secret.
        token_path: Path to token file.

    Returns:
        Valid access_token string.
    """
    tokens = load_tokens(token_path)
    # Refresh if expires within 60 seconds
    if time.time() >= tokens["expires_at"] - 60:
        return refresh_access_token(
            client_id, client_secret, tokens["refresh_token"], token_path
        )
    return tokens["access_token"]


def fetch_activities(
    access_token: str,
    after: int | None = None,
    per_page: int = 200,
    page: int = 1,
) -> list[dict[str, Any]]:
    """
    Fetch a single page of athlete activities from Strava API.

    Args:
        access_token: Valid Strava OAuth access token.
        after: Optional Unix timestamp; only activities after this time.
        per_page: Number of activities per page (max 200).
        page: Page number (1-based).

    Returns:
        List of raw activity dicts from GET /athlete/activities.
    """
    session = _session_with_retries()
    params: dict[str, int] = {"per_page": per_page, "page": page}
    if after is not None:
        params["after"] = after
    response = session.get(
        "https://www.strava.com/api/v3/athlete/activities",
        headers={"Authorization": f"Bearer {access_token}"},
        params=params,
    )
    response.raise_for_status()
    return response.json()


def fetch_all_activities(
    client_id: str,
    client_secret: str,
    after: int | None = None,
    token_path: str | Path | None = None,
) -> list[dict[str, Any]]:
    """
    Fetch all activities with pagination, using incremental load if `after` is set.

    Authenticates with Strava (auto-refresh if needed), then calls
    GET /athlete/activities with pagination until no more results.

    Args:
        client_id: Strava OAuth client ID.
        client_secret: Strava OAuth client secret.
        after: Optional Unix timestamp for incremental loads (only activities after).
        token_path: Path to token file.

    Returns:
        List of raw activity dicts from Strava.
    """
    access_token = get_valid_access_token(client_id, client_secret, token_path)
    all_activities: list[dict[str, Any]] = []
    page = 1
    per_page = 200
    while True:
        batch = fetch_activities(
            access_token, after=after, per_page=per_page, page=page
        )
        if not batch:
            break
        all_activities.extend(batch)
        if len(batch) < per_page:
            break
        page += 1
    return all_activities
