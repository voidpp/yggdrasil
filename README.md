## Getting started

- Install and activate [direnv](https://direnv.net/)
- Define the `VENV_HOME_BASE_DIR` environment variable in the `.env` file
- Reload your environment with `direnv allow`

## Running the tests
```shell
docker compose up -d
pytest tests
```