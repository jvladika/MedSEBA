import React from "react";
import { Project } from "../../types";
import { SidebarItem } from "../SidebarItem";
import { useSidebar } from "../../../../../context/SidebarContext";

interface ProjectItemProps {
  project: Project;
  sidebarOpen: boolean;
  onDelete: (id: number) => void;
  onRename: (id: number, newTitle: string) => void;
}

export const ProjectItem = ({
  project,
  sidebarOpen,
  onDelete,
  onRename,
}: ProjectItemProps) => {
  const { projectQueries } = useSidebar();
  return (
    <SidebarItem
      id={project.id}
      title={project.name}
      subtitle={project.description}
      tooltipText={project.description || project.name}
      sidebarOpen={sidebarOpen}
      type="project"
      onRename={onRename}
      onDelete={onDelete}
    />
  );
};
