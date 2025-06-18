import SuperService from "./SuperService";
import { HttpMethod } from "../constants"; 
import { API_base_URL, API_Endpoints } from "../constants/Endpoints";
import { Project } from "../../ui/components/sideBar/types";

export default class ProjectService extends SuperService {
    async listProjects(callback: (data: Project[]) => void) {
        await this.handleRequest(
            HttpMethod.GET,
            API_base_URL + "/api/projects/",
            undefined,
            callback
        );
    }

    async createProject(data: { name: string; description: string }, callback: () => void){
        await this.handleRequest(
            HttpMethod.POST,
            API_base_URL + "/api/projects/",
            data as unknown as JSON,
            callback

        );
    }

    async deleteProject(id: number, callback: () => void){
        await this.handleRequest(
            HttpMethod.DELETE,
            API_base_URL + `/api/projects/${id}/`,
            undefined,
            callback
        )
    }

    async updateProject(itemId: number, data: { name: string }, callback: () => void) {
        await this.handleRequest(
            HttpMethod.PUT,
            API_base_URL + `/api/projects/${itemId}/`,
            data as unknown as JSON,
            callback
        )
    }
}