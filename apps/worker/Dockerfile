FROM python:3.12-slim
RUN pip install --no-cache-dir uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src src
ENTRYPOINT ["uv","run","radar-ia-worker","run"]
CMD ["--demo"]
