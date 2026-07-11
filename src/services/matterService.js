const API = "http://localhost:3001";


export const matterService = {

    async getMatters() {
        const response = await fetch(`${API}/matters`);
        return await response.json();
    },

    async getMatter(id) {
        const response = await fetch(`${API}/mattersDetails/${id}`);
        return await response.json();

    },

    async createMatter(title, model, nextHearing) {

        const id = Date.now().toString();

        const matter = {

            id,
            title,
            lastMessage: "",
            conversations: [],
            documents: [],
            tasks: [],
            updatedAt: "Just now",
            nextHearing

        };

        await fetch(`${API}/matters`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(matter)

        });

        const matterDetail = {

            id,
            matterId: Number(id),
            title,
            model,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            conversations: []

        };

        await fetch(`${API}/mattersDetails`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(matterDetail)

        });

        return matter;

    },

    async updateMatter(id, payload) {

        const response = await fetch(`${API}/matter/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        return await response.json();
    },

    async deleteMatter(id) {

        await fetch(`${API}/matter/${id}`, {
            method: "DELETE"
        });

    },
    
    async getAvailableMatters(conversationId) {

        console.log("Conversation ID:", conversationId);

        const matters = await this.getMatters();

        console.log("All Matters:", matters);

        const data = matters.filter((matter) => {

            const exists = matter.conversations?.some((conversation) => {

                console.log(
                    "Comparing:",
                    conversation.id,
                    "===",
                    conversationId
                );

                return String(conversation.id) === String(conversationId);

            });

            console.log("Already linked:", exists);

            return !exists;

        });

        console.log("Filtered Matters:", data);

        return data;

    }

};