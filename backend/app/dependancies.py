from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from langchain_voyageai import VoyageAIEmbeddings
from app.config import settings
from app.database import async_engine

embeddings = VoyageAIEmbeddings(
    model="voyage-3",
    voyage_api_key=settings.voyage_api_key,
)


pc = Pinecone(api_key=settings.pinecone_api_key)
index = pc.Index("docqa-index")

vector_store = PineconeVectorStore(embedding=embeddings, index=index)
