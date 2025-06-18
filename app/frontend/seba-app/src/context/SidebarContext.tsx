import React, { createContext, useContext, useState } from "react";
import { SearchHistoryItemType } from "../ui/components/sideBar/types";
import { Project } from "../ui/components/sideBar/types";
import api from "../api";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface SidebarContextType {
  searchHistory: SearchHistoryItemType[];
  projectQueries: { [key: number]: SearchHistoryItemType[] };
  projects: Project[];
  isLoadingProjects: boolean;
  projectsError: string | null;
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItemType[]>>;
  updateSearchHistory: () => Promise<void>;
  updateProjectQueries: () => Promise<void>;
  createProject: (data: { name: string; description: string }) => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
  renameProject: (projectId: number, newTitle: string) => Promise<void>;
  resetSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItemType[]>(
    []
  );
  const [projectQueries, setProjectQueries] = useState<{
    [key: number]: SearchHistoryItemType[];
  }>({});

  const resetSidebar = () => {
    setSearchHistory([]);
    setProjectQueries({});
    setProjects([]);
    setIsLoadingProjects(false);
    setProjectsError(null);
  }


  const updateSearchHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get("/api/search-history/active/");
      setSearchHistory(response.data);
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const updateProjectQueries = async () => {
    if (!isAuthenticated) return;
    try {
      // First get all projects
      const projectsResponse = await api.get("/api/projects/");
      const projects = projectsResponse.data;

      // Fetch all queries in parallel
      const queries: { [key: number]: SearchHistoryItemType[] } = {};
      await Promise.all(
        projects.map(async (project: Project) => {
          try {
            const response = await api.get(
              `/api/projects/${project.id}/queries/`
            );
            queries[project.id] = response.data;
          } catch (error) {
            console.error(
              `Error loading queries for project ${project.id}:`,
              error
            );
            queries[project.id] = [];
          }
        })
      );
      setProjectQueries(queries);
    } catch (error) {
      console.error("Error loading project queries:", error);
      setProjectQueries({});
    }
  };

  const createProject = async (data: { name: string; description: string }) => {
    try {
      const response = await api.post("/api/projects/", data);
      setProjects((prev) => [response.data, ...prev]);
      
      // Initialize empty queries for the new project
      setProjectQueries(prevQueries => ({
        ...prevQueries,
        [response.data.id]: []
      }));
      
      //await fetchProjects();
      //await updateProjectQueries();
      return response.data;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await api.get("/api/projects/");
      setProjects(response.data);
    } catch (err) {
      setProjectsError("Failed to fetch projects");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const renameProject = async (projectId: number, newTitle: string) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/`, {
        name: newTitle,
      });
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId ? { ...project, name: newTitle } : project
        )
      );
      return response.data;
    } catch (error) {
      console.error("Error renaming project:", error);
      throw error;
    }
  };

  const deleteProject = async (projectId: number) => {
    try {
      await api.delete(`/api/projects/${projectId}/`);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      updateSearchHistory();
      updateProjectQueries();
    } else {
      resetSidebar();
    }
  }, [isAuthenticated]);

  return (
    <SidebarContext.Provider
      value={{
        searchHistory,
        projectQueries,
        projects,
        isLoadingProjects,
        projectsError,
        setSearchHistory,
        updateSearchHistory,
        updateProjectQueries,
        createProject,
        deleteProject,
        renameProject,
        resetSidebar,
        
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within SidebarProvider");
  return context;
};
