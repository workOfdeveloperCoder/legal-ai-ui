const API = "http://localhost:3001";

export const chatService = {

    async getConversations() {

        const response = await fetch(`${API}/conversations`);

        return await response.json();

    },

    async getConversation(conversationId) {

        const response = await fetch(
            `${API}/conversationDetails?conversationId=${conversationId}`
        );
        const data = await response.json();

        return data[0];

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
    

    async sendMessage(conversationId, message) {

        alert("1: sendMessage started");

        const conversation = await this.getConversation(conversationId);

        alert("2: conversation loaded: " + JSON.stringify(conversation));

        const metaResponse = await fetch(
            `${API}/conversations/${conversationId}`
        );

        alert("Response status: " + metaResponse.status);

        const conversationMeta = await metaResponse.text();

        alert("Response body: " + conversationMeta);

        alert("3: conversation meta loaded");

        const isFirstMessage = !conversation?.messages?.length;

        alert("4: isFirstMessage: " + isFirstMessage);

        await fetch(`${API}/conversations/${conversationId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...(isFirstMessage && {
                    title:
                        message.length > 40
                            ? `${message.substring(0, 40)}...`
                            : message,
                }),
                lastMessage: message,
                updatedAt: "Just now",
            }),
        });

        alert("5: conversation PATCH completed");

        conversation.messages.push({
            id: Date.now(),
            role: "user",
            content: message,
            createdAt: new Date().toISOString(),
        });

        alert("6: user message added");

        conversation.messages.push({
            id: Date.now() + 1,
            role: "assistant",
            content: "Dummy AI response...",
            createdAt: new Date().toISOString(),
        });

        alert("7: AI message added");

        await fetch(`${API}/conversationDetails/${conversation.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(conversation),
        });

        alert("8: conversation details saved");

        return conversation;
    },
    async createConversation() {

        const conversation = await fetch(`${API}/conversations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "New Conversation",
                lastMessage: "",
                updatedAt: "Just now",
                matter: null,
            }),
        });

        const newConversation = await conversation.json();

        await fetch(`${API}/conversationDetails`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: newConversation.id,
                conversationId: newConversation.id,
                messages: [],
            }),
        });

        return newConversation;

    },

    // async createConversationNsendMessage(message) {

        // const newConversation = await this.createConversation();

        // return await this.sendMessage(
        //     newConversation.id,
        //     message
        // );

    // }

}