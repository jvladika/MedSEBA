# This scirpt evaluates two embedding models (pubMed and simSce) on the BIOSSES dataset.
# The tasks consits of predicting the similarity between two sentences of the BIOSSES dataset.
# The evaluation metric is the pearson correlation coefficient on the gold label.
from sentence_transformers import SentenceTransformer
from datasets import load_dataset
from typing import List, Tuple
from torch.nn.functional import cosine_similarity
from scipy.stats import pearsonr

# Load models
modelPubMed = SentenceTransformer('pritamdeka/S-PubMedBert-MS-MARCO-SCIFACT')
modelSimSCE = SentenceTransformer('kamalkraj/BioSimCSE-BioLinkBERT-BASE')

# Load BIOSSES dataset
biossesDataset = load_dataset("biosses")["train"]

#Normalizes the scores in BIOSSES from [0, 4] to [-1,1] to fit the un-pruned cosine siiliarity domain
def normalizeScores(scores: List[float]) -> List[float]:
    return [((score / 2) - 1) for score in scores]

#Normalizes the scores in BIOSSES from [0, 4] to [0,1] to fit the pruned cosine siiliarity domain
def normalizeScoresTo01(scores: List[float]) -> List[float]:
    return [score / 4 for score in scores]

# Function to calculate cosine similarity
def calculateCosineSimilarity(
        model: SentenceTransformer,
        sentencePairs: List[Tuple[str, str]],
        prune: bool = False #Indicates wether we want to prune the cosine similarity scores to [0, 1]
    ) -> List[float]:
    similarities = []
    for sentence1, sentence2 in sentencePairs:
        # We add an extra dimension to the output tensor with .unsqueeze(0), because cosine_similarity expects a 2D tensor, but the embeddings are 1D.
        # This is because cosine_similarity can handle batch-operations, i.e. compute the similarities between lists of vectos (2D). 
        embedding1 = model.encode(sentence1, convert_to_tensor=True).unsqueeze(0)
        embedding2 = model.encode(sentence2, convert_to_tensor=True).unsqueeze(0)
        similarity = cosine_similarity(embedding1, embedding2).item()
        if prune:
            similarity = max(0, similarity)
        similarities.append(similarity)
    return similarities

# Main evaluation function
def evaluateAndCompareModels(
        modelPubMed: SentenceTransformer,
        modelSimSCE: SentenceTransformer,
        dataset,
        pruneCosineSimilarity: bool = False
    ) -> str:
    sentencePairs = [(item['sentence1'], item['sentence2']) for item in dataset]
    if pruneCosineSimilarity:
        groundTruths = normalizeScoresTo01([item['score'] for item in dataset])
    else:
        groundTruths = normalizeScores([item['score'] for item in dataset])

    #pearsonr() returns a tuple: the correlation-coefficient and the associated p-value (we want the first)
    correlationPubMed = pearsonr(calculateCosineSimilarity(modelPubMed, sentencePairs, pruneCosineSimilarity), groundTruths)[0]
    correlationSimSCE = pearsonr(calculateCosineSimilarity(modelSimSCE, sentencePairs, pruneCosineSimilarity), groundTruths)[0]

    print(f"S-PubMedBERT Correlation: {correlationPubMed}")
    print(f"SimSCE Correlation: {correlationSimSCE}")

    return "S-PubMedBERT" if correlationPubMed > correlationSimSCE else "SimSCE"

# Evaluate and compare models
##############################
#V1: Un-Pruned Cosine-Similarity in [-1, 1]
betterModel = evaluateAndCompareModels(modelPubMed, modelSimSCE, biossesDataset, pruneCosineSimilarity=False) 
print(f"The better model for unpruned cosine similarity is: {betterModel}")
#V1: Pruned Cosine-Similarity to [0, 1]
betterModel = evaluateAndCompareModels(modelPubMed, modelSimSCE, biossesDataset, pruneCosineSimilarity=True) 
print(f"The better model for pruned cosine similarity is: {betterModel}")