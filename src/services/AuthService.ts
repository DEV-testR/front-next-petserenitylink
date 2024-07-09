import {Observable, from, throwError, of, catchError, switchMap} from 'rxjs';
const aliBaseUrl: string = process.env.NEXT_PUBLIC_API_URL as string;
const apiVersion: string = 'v1';
const BASE_URL:string = `${aliBaseUrl}/${apiVersion}/auth`;
const authService = {
    getItemLocalStorage: (key: string): Observable<string> => {
        return new Observable<string>(observer => {
            let item:string|null = localStorage.getItem(key);
            item = (!item) ? '' : item;
            observer.next(item);
            observer.complete();
        });
    },

    async logIn(email: string, password: string): Promise<Response> {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const requestOptions: RequestInit = {
            method: 'POST',
            body: formData,
            redirect: 'follow',
        };

        return fetch(`${BASE_URL}/authenticate`, requestOptions);
    },

    async logOut(): Promise<void> {
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }
    },

    async register(firstname: string, lastname: string, email: string, password: string): Promise<Response> {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('firstname', firstname);
        formData.append('lastname', lastname);

        const requestOptions: RequestInit = {
            method: 'POST',
            body: formData,
            redirect: 'follow',
        };

        return fetch(`${BASE_URL}/register`, requestOptions);
    },

    // Helper function to get the access token from local storage
    getAccessToken: (): string => {
        let accessToken = localStorage.getItem('accessToken');
        return accessToken ? accessToken : '';
    },

    getRefreshToken: (): string => {
        let refreshToken = localStorage.getItem('refreshToken');
        return refreshToken ? refreshToken : '';
    },

    refreshAccessToken(): Observable<string> {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
            // Handle the case where the refresh token is missing
            return throwError(() => new Error('Missing refresh token'));
        }

        return from(
            fetch(`${BASE_URL}/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${refreshToken}`,
                },
                redirect: 'follow', // Optional if redirects are expected
            })
        )
        .pipe(
            catchError((error) => {
                console.error('Error refreshing token:', error);
                return throwError(() => error); // Pass the error object directly
            }),
            switchMap((response) => {
                if (!response.ok) {
                    return throwError(() => new Error('Failed to refresh token'));
                }

                return response.json();
            }),
            switchMap((data) => {
                localStorage.setItem('accessToken', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);
                return of(data.access_token);
            })
        );
    },

    refreshToken(): Observable<void> {
        return this.getItemLocalStorage('accessToken').pipe(
            switchMap(refreshToken => {
                if (!refreshToken) {
                    return throwError(() => new Error('Refresh token not found in localStorage'));
                }

                const headers = new Headers();
                headers.append('Authorization', `Bearer ${refreshToken}`);

                const options: RequestInit = {
                    method: 'POST',
                    headers,
                    redirect: 'follow',
                };

                return from(fetch(`${BASE_URL}/refresh-token`, options)).pipe(
                    switchMap(response => {
                        if (!response.ok) {
                            return throwError(() => new Error('Failed to refresh token'));
                        }
                        return from(response.json());
                    }),
                    switchMap(result => {
                        localStorage.setItem('accessToken', result.access_token);
                        localStorage.setItem('refreshToken', result.refresh_token);
                        return of(undefined); // Return empty observable for clarity
                    }),
                    catchError(error => {
                        console.error('Error refreshing token:', error);
                        return throwError(() => new Error('Failed to refresh token'));
                    }),
                );
            }),
        );
    },
};

export default authService;
  