import {UserInfo} from "@/types/userInfo";
import {catchError, delay, from, mergeMap, Observable, of, retry, take, throwError} from 'rxjs';
import authService from "@/services/AuthService";
import {switchMap} from "rxjs/operators";

const aliBaseUrl: string = process.env.NEXT_PUBLIC_API_URL as string;
const apiVersion: string = 'v1';
const apiUrl = `${aliBaseUrl}/${apiVersion}/users`;

const userService = {

    getUserInfo(): Observable<UserInfo | undefined> {
        return authService.getItemLocalStorage('accessToken').pipe(
            switchMap(accessToken => {
                if (!accessToken) {
                    return throwError(() => new Error('Access token not found in localStorage'));
                }

                const headers = new Headers();
                headers.append('Authorization', `Bearer ${accessToken}`);

                const options: RequestInit = {
                    method: 'GET',
                    headers,
                    redirect: 'follow',
                };

                return from(fetch(`${apiUrl}/userInfo`, options))
                .pipe(
                    catchError(handleError), // Use a central error handler
                    retry({ // Replace retryWhen with retry
                        delay: retryWithRefresh, // Pass retryWithRefresh function to delay property
                        count: 2, // Set retry count (optional, defaults to 4)
                    }), // Use a dedicated retry function
                    // Use toPromise with type assertion
                    mergeMap(response => (!response.ok) ? of(undefined) : response.json().then((data: any) => data as UserInfo)),
                    take(1), // Ensure only one emission
                );
            }),
        );
    }
};

const handleError = (error: any): Observable<never> => {
    console.error('Error fetching user info:', error);
    return throwError(() => error);
};

const retryWithRefresh = (errors: Observable<any>): Observable<any> => {
    let retryCount = 0;
    return errors.pipe(
        mergeMap(error => {
            retryCount++;
            if (retryCount <= 2 && error instanceof Response && error.status === 401) {
                // Retry on 401 with delay
                return authService.refreshToken().pipe(delay(1000));
            }
            return throwError(() => error); // Propagate other errors or exceeded retries
        }),
    );
};

export default userService;
