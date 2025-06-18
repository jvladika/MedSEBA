import weaviate

client = weaviate.Client(
    url="http://localhost:8080",
    auth_client_secret=None
)
