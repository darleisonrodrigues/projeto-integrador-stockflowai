export const API_URL = 'http://localhost:3000';

const getHeaders = (isFormData = false): HeadersInit => {
    const headers: Record<string, string> = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    get: async (endpoint: string) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro na requisição');
        }
        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro na requisição');
        }
        return response.json();
    },

    put: async (endpoint: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro na requisição');
        }
        return response.json();
    },

    patch: async (endpoint: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(isFormData),
            body: isFormData ? data : JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro na requisição');
        }
        return response.json();
    },

    delete: async (endpoint: string) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro na requisição');
        }
        return response.json();
    },

    downloadBlob: async (endpoint: string) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erro ao baixar arquivo' }));
            throw new Error(error.error || 'Erro ao baixar arquivo');
        }
        return response.blob();
    }
};
