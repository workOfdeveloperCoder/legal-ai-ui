const API = "http://localhost:3001";

export const dashboardService = {

    async getDashboard() {

        const response = await fetch(`${API}/dashboard`);

        return response.json();

    }

};