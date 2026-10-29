import {config} from "../config/config"

export default class ApiService {

    constructor() {
        this.config = config
        this.baseUrl = config.api.baseUrl;
        this.token = null;
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) headers.Authorization = `Bearer ${this.token}`;

        const response = await fetch(
            `${this.baseUrl}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `HTTP ${response.status}`
            );
        }

        return data;
    }

    async getSpin(spinType = 'basegame', gameMode = 'Regular') {
        if (!this.session) {
            throw new Error('No active session');
        }

        return await this.request(`/spin/${this.session.sessionId}`, {
            method: 'POST',
            body: JSON.stringify({
                spinType,
                gameMode
            })
        });
    }

    async login() {
        const savedToken = sessionStorage.getItem('token');

        const { username, password, secretId, gameName } = this.config.api

        if (savedToken) {
            this.token = savedToken;
        } else {
            const authData = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password,
                })
            });

            this.token = authData.token;

            sessionStorage.setItem('token', authData.token);
        }

        const sessionData = await this.request('/session', {
            method: 'POST',
            body: JSON.stringify({
                gameName,
                secretId,
            })
        });

        this.session = sessionData;
        console.log('session loaded');

        return sessionData;
    }

    async logout() {
        await this.destroySession();
        this.session = null;
    }

    async destroySession() {
        if (!this.session) {
            return;
        }

        try {
            const response = await this.request(`/session/${this.session.sessionId}`, {
                method: 'DELETE'
            });

            if (response.ok){
            }

        } catch (error) {
            console.error('Error destroying session', error);
        }
    }
}