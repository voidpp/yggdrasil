from pathlib import Path


class Folders:
    root = Path(__file__).parent.parent.resolve()
    project_root = root.parent
    frontend = project_root / "react-ts"
