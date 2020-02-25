import { WebAPIConfig } from '../../state';

const CATE_HUB_DOMAIN = 'catehub.192.171.139.57.nip.io';

const CATE_SERVICE_PROTOCOL = 'https';
const CATE_SERVICE_ADDRESS = CATE_HUB_DOMAIN + '/user/{username}';
const CATE_SERVICE_PORT = null;

const CATE_HUB_API_URL = CATE_SERVICE_PROTOCOL + '://' + CATE_HUB_DOMAIN + '/hub/api/';
const CATE_HUB_TOKEN_URL = CATE_HUB_API_URL + 'authorizations/token';
const CATE_HUB_USER_SERVER_URL = CATE_HUB_API_URL + 'users/{username}/server';
const CATE_HUB_USER_URL = CATE_HUB_API_URL + 'users/{username}';

export interface AuthInfo {
    token: string;
    user: User;
    warning?: string;
}

export interface User {
    kind: string;
    name: string;
    admin: boolean;
    groups: string[];
    server: string | null;
    pending: string | null;
    created: string;
    last_activity: string;
    servers: any | null;
    auth_state?: any;
}

export class AuthAPI {
    // noinspection JSMethodCanBeStatic
    getWebAPIConfig(username: string): WebAPIConfig {
        return {
            serviceProtocol: CATE_SERVICE_PROTOCOL,
            serviceAddress: CATE_SERVICE_ADDRESS.replace('{username}', username),
            servicePort: CATE_SERVICE_PORT,
        };
    }

    auth(username: string, password: string): Promise<AuthInfo> {
        const url = new URL(CATE_HUB_TOKEN_URL);
        console.log('POST: ', url);
        return fetch(url.toString(), {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password}),
        }).then((response: Response) => {
            if (response.ok) {
                return response.json() as Promise<AuthInfo>;
            } else {
                throw newFetchError(response);
            }
        });
    }

    getUser(username: string, token: string): Promise<User | null> {
        const url = new URL(CATE_HUB_USER_URL.replace('{username}', username));
        console.log('GET: ', url);
        return fetch(url.toString(), {
            method: 'get',
            headers: {
                'Authorization': `token ${token}`,
            }
        }).then((response: Response) => {
            if (response.ok) {
                return response.json() as Promise<User>;
            }
            return null;
        });
    }

    startWebAPI(username: string, token: string): Promise<boolean> {
        const url = new URL(CATE_HUB_USER_SERVER_URL.replace('{username}', username)).toString();
        console.log('POST: ', url);
        return fetch(url.toString(), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${token}`,
            },
            body: '{"profile" : "Cate Web-API Service"}',
        }).then((response: Response) => {
            if (response.ok) {
                return true;
            }
            throw newFetchError(response);
        });
    }

    stopWebAPI(username: string): Promise<boolean> {
        const url = new URL(CATE_HUB_USER_SERVER_URL.replace('{username}', username)).toString();
        console.log('DELETE: ', url);
        return fetch(url.toString(), {
            method: 'delete',
        }).then((response: Response) => {
            if (response.ok) {
                return true;
            }
            throw newFetchError(response);
        });
    }
}


function newFetchError(response: Response) {
    return new Error(`${response.statusText} (HTTP status ${response.status})`);
}

