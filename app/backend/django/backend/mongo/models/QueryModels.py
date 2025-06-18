#This file contains all the models that are relevant to the QueryController

from .abstraction.AbstractBaseModel import AbstractBaseModel
from django.db import models
from mongoengine import fields,CASCADE

class QueryResult(AbstractBaseModel):
    meta = {
        'collection': 'QueryResults', 
    }
     
    """
    Represents an atomic response from the /query/{queryText} endpoint. It pais a document with the provided queryText, for later identification.
    """
    documentId = fields.StringField(max_length=100)
    query = fields.StringField()
    score = fields.StringField()
    alpha = fields.StringField()

    # Add other fields like cosineSimilarity if needed

    def toDict(self):
        """ Extend the base toDict method with additional fields """
        data = super().toDict()
        data.update({
            "documentId": self.documentId,
            "query": self.query,
            "score": self.score,
        })
        return data



class QueryResultFeedback(AbstractBaseModel):
    meta = {
        'collection': 'QueryResultFeedback', 
    }
    """
    Represents the feedback a user has given to a specific result of a query.
    That is, a boolean (representing the feedback-state), tied to a specific QueryResult (stored in the db already).
    """
    queryResult = fields.ReferenceField(QueryResult, reverse_delete_rule=CASCADE)   
    isPositiveFeedback = fields.BooleanField()

    