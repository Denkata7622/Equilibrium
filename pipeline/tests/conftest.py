"""Shared pytest config — handles --run-live flag and skips live tests by default."""
import sys

import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--run-live",
        action="store_true",
        default=False,
        help="Run live tests that make real API calls (incurs cost)",
    )
    parser.addoption(
        "--max-cost",
        type=float,
        default=0.10,
        help="Documented budget for live session (informational)",
    )


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "live: calls real AI APIs (cost money, need --run-live)",
    )
    # ── Windows UTF-8 workaround ──
    # pipeline.py / integrate.py call sys.stdout.reconfigure(encoding='utf-8')
    # at import time on Windows. That closes pytest's fd-capture buffer and
    # produces cascading "I/O operation on closed file" errors on every test.
    # Neutralize reconfigure for the test session — pytest handles encoding.
    for name in ("stdout", "stderr"):
        stream = getattr(sys, name, None)
        if stream is None or not hasattr(stream, "reconfigure"):
            continue
        try:
            stream.reconfigure = lambda *a, **k: None
        except (AttributeError, TypeError):
            pass  # stream type doesn't allow attribute assignment — ignore


def pytest_collection_modifyitems(config, items):
    if config.getoption("--run-live"):
        return
    skip_live = pytest.mark.skip(
        reason="need --run-live to run (real API calls cost money)"
    )
    for item in items:
        if "live" in item.keywords:
            item.add_marker(skip_live)