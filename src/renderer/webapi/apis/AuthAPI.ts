import { WebAPIClient } from '../WebAPIClient';

const CATE_HUB_USER_URL = 'https://catehub.192.171.139.57.nip.io/user/{username}';
const CATE_HUB_API_URL = 'https://catehub.192.171.139.57.nip.io/hub/api/';
const CATE_HUB_TOKEN_URL = CATE_HUB_API_URL + 'authorizations/token';
const CATE_HUB_USER_SERVER_URL = CATE_HUB_API_URL + 'users/{username}/server';

export class AuthAPI {

    getToken(username: string, password: string): Promise<string> {
        return fetch(CATE_HUB_TOKEN_URL, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
        }).then((response: Response) => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        }).then((response: string) => {
            const result = JSON.parse(response);
            if (typeof result.token === 'string' && result.token.length > 0) {
                return result.token;
            } else {
                throw new Error('Sorry, no access token for you this time.');
            }
        });
    }

    startWebAPI(username: string, token: string): Promise<string> {
        return fetch(CATE_HUB_USER_SERVER_URL.replace('{username}', username), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${token}`,
            },
            body: '{"profile" : "Cate Web-API Service"}',
        }).then((response: Response) => {
            if (response.ok) {
                return CATE_HUB_USER_URL.replace('{username}', username);
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        });
    }


    stopWebAPI(username: string): Promise<boolean> {
        return fetch(CATE_HUB_USER_SERVER_URL.replace('{username}', username), {
            method: 'delete',
        }).then((response: Response) => {
            if (response.ok) {
                return true;
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        });
    }
}

