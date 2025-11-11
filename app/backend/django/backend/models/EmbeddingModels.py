# Embedding Wrapper classes to wrap a given model and define a common interface
from abc import ABC
from sentence_transformers import SentenceTransformer
from typing import List, Union
import torch

class AbstractEmbeddingModel(ABC):

  def __init__(self):
    self.model: SentenceTransformer = None
    self.identifier : str = ""
    raise NotImplementedError("This is an abstract class; 'init' must be implemented in subclasses.")

  def embedText(self, text:str, asTensor: bool=False) -> Union[List[float], torch.tensor]:
    embedding = self.model.encode(text, convert_to_tensor=True).unsqueeze(0)
    if asTensor:
       return embedding
    else:
      return embedding.tolist()[0]
  
  def unitCosineSimilarity(self, text1: str, text2: str, prune: bool = True) -> float:
      embedding1: torch.tensor = self.embedText(text1, asTensor=True)
      embedding2: torch.tensor = self.embedText(text2, asTensor=True)
      similarity = torch.nn.functional.cosine_similarity(embedding1, embedding2).item()
      if prune:
          similarity = max(0, similarity) # Prune similarity to be within [0, 1]
      else:
          # Scale from [-1, 1] to [0, 1]
          similarity = (similarity + 1) / 2
      return similarity
  
class bmRetriever(AbstractEmbeddingModel):
    def __init__(self):
        self.model = SentenceTransformer("BMRetriever/BMRetriever-410M")
        self.identifier : str = "BMRetriever/BMRetriever-410M"

class sPubMedBERT(AbstractEmbeddingModel):
    def __init__(self):
        self.model = SentenceTransformer('pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT')
        self.identifier : str = "pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT"

class simSce(AbstractEmbeddingModel):
    def __init__(self):
        self.model = SentenceTransformer('kamalkraj/BioSimCSE-BioLinkBERT-BASE')
        self.identifier : str = "kamalkraj/BioSimCSE-BioLinkBERT-BASE"

# A singleton representing the default model
default_embeddingModel_instance: AbstractEmbeddingModel = sPubMedBERT()
