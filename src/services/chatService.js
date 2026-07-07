const API = "http://localhost:3001";

export const chatService = {

    async getConversations() {

        const response = await fetch(`${API}/conversations`);

        return await response.json();

    },

    async getConversation(conversationId) {

        const response = await fetch(
            `${API}/conversationDetails/${conversationId}`
        );
        const data = await response.json();

        return data;

    },

    async sendMessage(conversationId, message) {

        const conversation = await this.getConversation(conversationId);

        conversation.messages.push({

            id: Date.now(),

            role: "user",

            content: message,

            createdAt: new Date().toISOString()

        });

        conversation.messages.push({

            id: Date.now() + 1,

            role: "assistant",

            content: "Dummy AI response...",

            createdAt: new Date().toISOString()

        });

        await fetch(

            `${API}/conversationDetails/${conversation.id}`,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(conversation)

            }

        );

        return conversation;

    },

    async getAvailableConversations(matterId) {

        const conversations = await this.getConversations();


        const hasMatter = conversations.some(
            conversation => conversation.matter?.id === String(matterId)
        );


        if (!hasMatter) {
            return conversations;
        }


        return conversations.filter(
            conversation => conversation.matter?.id !== String(matterId)
        );

    },


}