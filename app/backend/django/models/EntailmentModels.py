from abc import ABC, abstractmethod
from typing import Optional
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from torch import Tensor

class AbstractEntailmentModel(ABC):
    """
    Base class for any given sentence-entailment model.
    """

    @abstractmethod
    def __init__(self):
        self.identifier: str = ""
        raise NotImplementedError("This is an abstract class; 'init' must be implemented in subclasses.")

    class Prediction():
        """
        A data class to represent a formatted response of any 'AbstractEntailmentModel'
        """
        def __init__(
            self,
            contradiction: float,
            entailment: float,
            neutral: Optional[float],
        ) -> None:
            self.contradiction = contradiction
            self.entailment = entailment
            self.neutral = neutral
            # Validate probability distribution characteristic
            probSum = self.contradiction + self.entailment + (self.neutral or 0.0)
            if not 0.99 <= probSum <= 1.01:
                raise ValueError("The provided values do not constitute a valid probability distribution.")

    @abstractmethod
    def predict(self, sentence_a: str, sentence_b: str) -> 'AbstractEntailmentModel.Prediction':
        raise NotImplementedError("This is an abstract class; 'predict' method must be implemented in subclasses.")

class AbstractSequenceClassificationModel(AbstractEntailmentModel):
    """
    Abstract wraper class for models subclassing from Huggingface's 'AutoModelForSequenceClassification'.
    """

    @abstractmethod
    def __init__(self):
        self.model: AutoModelForSequenceClassification = None
        self.tokenizer: AutoTokenizer = None
        self.identifier: str = ""
        raise NotImplementedError("This is an abstract class; 'init' must be implemented in subclasses.")

    @abstractmethod
    def _tokenize(self, sentence_a:str, sentence_b:str) -> dict[str, torch.Tensor]:
        """
        Returns the tokenized input to be handed to the model.
        Implementation is subclass responsibility.
        """
        raise NotImplementedError("This is an abstract class; '_tokenize' must be implemented in subclasses.")

    def _predictProbabilities(self, sentence_a: str, sentence_b: str) -> torch.Tensor:
        """
        Returns the final probabilities producecd by a model.
        Hanling those is a subclass responsibility, sice prediction formats might differ (e.g. one model might decide to predicit netrality, some do not.) 
        """
        inputs = self._tokenize(sentence_a, sentence_b)
        outputs = self.model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        return probs

class DeBERTaV3(AbstractSequenceClassificationModel):
    def __init__(self):
        # Use specific version and disable fast tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            "tasksource/deberta-base-long-nli",
            use_fast=False,
            trust_remote_code=True,
            model_max_length=512
        )
        self.model = AutoModelForSequenceClassification.from_pretrained(
            "tasksource/deberta-base-long-nli",
            trust_remote_code=True
        )
        self.identifier: str = "tasksource/deberta-base-long-nli"

    def _tokenize(self, sentence_a: str, sentence_b: str) -> dict[str, torch.Tensor]:
        return self.tokenizer(sentence_a, sentence_b, return_tensors="pt")

    def predict(self, sentence_a: str, sentence_b: str) -> 'AbstractEntailmentModel.Prediction':
        probs = self._predictProbabilities(sentence_a, sentence_b)
        return AbstractEntailmentModel.Prediction(
            contradiction=probs[0][0].item(),
            entailment=probs[0][1].item(),
            neutral=probs[0][2].item(),
        )
    
class DeBERTaFinetunedHealth(DeBERTaV3):
    def __init__(self):
        self.model = AutoModelForSequenceClassification.from_pretrained("tasksource/deberta-base-long-nli")
        self.tokenizer = AutoTokenizer.from_pretrained("tasksource/deberta-base-long-nli")
        self.identifier = "tasksource/deberta-base-long-nli"
        # self.identifier = "deberta-finetuned-health"

    def _tokenize(self, sentence_a: str, sentence_b: str) -> dict[str, torch.Tensor]:
        return self.tokenizer(f"{sentence_b} [SEP] {sentence_a}", return_tensors="pt")
   
#A singleton representing the default model
default_entailmentModel_instance: AbstractEntailmentModel = DeBERTaFinetunedHealth()

# class BioBERTNLI(AbstractEntailmentModel):
#     def __init__(self):
#         self.model = AutoModelForSequenceClassification.from_pretrained(
#             "dmis-lab/biobert-base-cased-v1.2",  # Correct model name
#             num_labels=2,  # Binary classification
#             trust_remote_code=True
#         )
#         self.tokenizer = AutoTokenizer.from_pretrained(
#             "dmis-lab/biobert-base-cased-v1.2",  # Correct model name
#             trust_remote_code=True,
#             model_max_length=512
#         )
#         self.identifier = "dmis-lab/biobert-base-cased-v1.2"

#     def _tokenize(self, sentence_a: str, sentence_b: str) -> dict[str, torch.Tensor]:
#         # BioBERT follows BERT's input format
#         return self.tokenizer(
#             sentence_a, 
#             sentence_b, 
#             padding=True,
#             truncation=True,
#             return_tensors="pt"
#         )

#     def _predictProbabilities(self, sentence_a: str, sentence_b: str) -> torch.Tensor:
#         inputs = self._tokenize(sentence_a, sentence_b)
#         outputs = self.model(**inputs)
#         probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
#         return probs

#     def predict(self, sentence_a: str, sentence_b: str) -> 'AbstractEntailmentModel.Prediction':
#         probs = self._predictProbabilities(sentence_a, sentence_b)
#         # For binary classification, map the two outputs to contradiction and entailment
#         return AbstractEntailmentModel.Prediction(
#             contradiction=probs[0][0].item(),
#             neutral=0.0,  # No neutral class in binary classification
#             entailment=probs[0][1].item()
#         )

# # Update default instance
# default_entailmentModel_instance: AbstractEntailmentModel = BioBERTNLI()