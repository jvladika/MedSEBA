from django.db import models
from django.conf import settings 


class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    pmid = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")  
    title = models.TextField(null=True, blank=True)
    abstract = models.TextField(null=True, blank=True)
    source_url = models.TextField(null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    reference_count = models.IntegerField(null=True, blank=True)
    publication_venue = models.JSONField(null=True, blank=True)
    venue = models.TextField(null=True, blank=True)
    citation_count = models.IntegerField(null=True, blank=True)
    influential_citation_count = models.IntegerField(null=True, blank=True)
    fields_of_study = models.JSONField(null=True, blank=True)
    journal = models.JSONField(null=True, blank=True)
    authors = models.JSONField(null=True, blank=True)
    overall_similarity = models.FloatField(null=True, blank=True)
    embedding_model = models.TextField(null=True, blank=True)
    most_relevant_sentence = models.TextField(null=True, blank=True)
    similarity_score = models.FloatField(null=True, blank=True)
    entailment_model = models.TextField(null=True, blank=True)
    agree = models.TextField(null=True, blank=True)
    disagree = models.TextField(null=True, blank=True)
    neutral = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.title or "Untitled Document"


class Comment(models.Model):
    comment_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")  
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="comments")
    line_number = models.IntegerField(null=True, blank=True)
    comment_text = models.TextField()

    def __str__(self):
        return f"Comment by {self.user} on {self.document}"


class Highlight(models.Model):
    HIGHLIGHT_COLOR_CHOICES = [
        ("yellow", "Yellow"),
        ("blue", "Blue"),
        ("green", "Green"),
        ("pink", "Pink"),
    ]

    highlight_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="highlights")  
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="highlights")
    text = models.TextField()
    page_number = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=10, choices=HIGHLIGHT_COLOR_CHOICES, default="yellow")
    is_crossed_out = models.BooleanField(default=False)

    def __str__(self):
        return f"Highlight on {self.document} by {self.user}"


class Bookmark(models.Model):
    bookmark_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")  
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="bookmarks")

    def __str__(self):
        return f"Bookmark by {self.user} on {self.document}"
