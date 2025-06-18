export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  project: Project;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export interface SearchHistoryItemType {
  id: number;
  query_text: string;
  custom_title: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  project: number | null;
}

export const ItemTypes = {
  SEARCH_HISTORY_ITEM: "searchHistoryItem",
  PROJECT_QUERY: "projectQuery",
} as const;

export interface DragItem {
  id: number;
  type: "searchHistoryItem" | "projectQuery";
  title: string;
  sourceProjectId: number | null;
}
