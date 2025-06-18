export interface FullDocument {
    document_id?: string;
    pmid?: string;
    user?: number;
    title?: string;
    abstract?: string;
    source_url?: string;
    year?: number;
    reference_count?: number;
    publication_venue?: any;
    citation_count?: number;
    influential_citation_count?: number;
    fields_of_study?: any[];
    journal?: any;
    authors?: any[];
    overall_similarity?: number;
    embedding_model?: string;
    most_relevant_sentence?: string;
    similarity_score?: number;
    entailment_model?: string;
    agree?: string;
    disagree?: string;
    neutral?: string;
  }