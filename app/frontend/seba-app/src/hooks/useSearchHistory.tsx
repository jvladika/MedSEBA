import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import api from "../api";

interface SearchHistoryItem {
  id: number;
  query_text: string;
  custom_title: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useSearchHistory = () => {
  const { isAuthenticated } = useAuth();
  const { updateSearchHistory } = useSidebar();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveSearchToHistory = async (query: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await api.post("/api/search-history/", {
        query_text: query,
      });
      //await api.put(`/api/search-history/${response.data.id}/`, {});
      await updateSearchHistory();
      return response.data;
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  return { saveSearchToHistory, searchHistory };
};
