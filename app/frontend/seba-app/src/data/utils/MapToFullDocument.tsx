import { Document } from '../../data/models/Document';
import { FullDocument } from '../../data/models/FullDocument';

//the rest of the fields are not assignable to the FullDocument type
export const mapToFullDocument = (doc: Document): FullDocument => ({
    pmid: doc.pmid || '',
    title: doc.title || '',
    abstract: doc.abstract || '',
    year: doc.publicationDate ? parseInt(doc.publicationDate) : 0,
    citation_count: doc.citations?.total ?? 0,
    most_relevant_sentence: doc.relevantSection?.mostRelevantSentence || '',
    similarity_score: doc.relevantSection?.similarityScore || 0,
    agree: doc.agreeableness?.agree?.toString() || '',
    disagree: doc.agreeableness?.disagree?.toString() || '',
    neutral: doc.agreeableness?.neutral?.toString() || ''
});
