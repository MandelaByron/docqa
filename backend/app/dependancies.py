from langchain_postgres import PGVector
from langchain_voyageai import VoyageAIEmbeddings
from app.config import settings
from app.database import async_engine

embeddings = VoyageAIEmbeddings(
    model="voyage-3",
    voyage_api_key=settings.voyage_api_key,
)


vector_store = PGVector(
    embeddings=embeddings,
    collection_name="documents",
    connection=async_engine,
    use_jsonb=True,
    create_extension=False,
)
