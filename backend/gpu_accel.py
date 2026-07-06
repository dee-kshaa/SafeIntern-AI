"""GPU acceleration compatibility layer with pandas fallback."""

from __future__ import annotations

GPU_ACCELERATED = False
ACCEL_BACKEND = "pandas"

try:
    import cudf.pandas  # type: ignore

    cudf.pandas.install()
    import pandas as pd  # type: ignore

    GPU_ACCELERATED = True
    ACCEL_BACKEND = "cudf.pandas"
except Exception:
    import pandas as pd  # type: ignore



def pipeline_status() -> dict:
    return {
        "gpu_accelerated": GPU_ACCELERATED,
        "acceleration_backend": ACCEL_BACKEND,
    }
