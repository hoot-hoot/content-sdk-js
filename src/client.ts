/** The client definitions for interacting with the content service. */

/** Imports. Also so typedoc works correctly. */
import 'isomorphic-fetch'
//import { MarshalFrom } from 'raynor'

///import { Env, isLocal } from '@truesparrow/common-js'
//import { WebFetcher } from '@truesparrow/common-server-js'
import { Session } from '@truesparrow/identity-sdk-js'
import { SessionToken } from '@truesparrow/identity-sdk-js/session-token'

import { Event, SubEventDetails } from './entities'


/** The base class for content service errors. */
export class ContentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ContentError';
    }
}

/** An error raised when user is not authorized to perform a certain operation. */
export class UnauthorizedContentError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedContentError';
    }
}

/** An error raised when an action on a user with a deleted event. */
export class DeletedEventForUserError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'NoEventForUserError';
    }
}

/** An error raised when an action is by an user without an event. */
export class NoEventForUserError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'NoEventForUserError';
    }
}


/** Things to update. */
export interface UpdateEventOptions {
    subEventDetails: SubEventDetails[];
}

/**
 * A client for interacting with the content service. This is meant for the user's interaction with
 * their own event. So it contains mutating operations and, in general, privileged operations.
 * @note There is a notion of call context, which is the user's identity. In a browser/client
 * environment this is implicit, and provided by standard methods (cookies). In a server
 * environment, this must be made explicit, via the {@link withContext} call. In any case, any
 * operation made is relative to the current user.
 */
export interface ContentPrivateClient {
    /**
     * Attach a {@link SessionToken} to the client, as an explicit context for future calls.
     * @param sessionToken - add this token to all calls made by the resulting client.
     * @return A new client, with the session token attached.
     */
    withContext(sessionToken: SessionToken): ContentPrivateClient;

    /**
     * Create an event for the given user.
     * @param session - extra session information to be used by the service. For XSRF protection.
     * @return The new event attached to the user.
     * @throws When the event already exists, it raises {@link ContentError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     */
    createEvent(session: Session): Promise<Event>;

    /**
     * Update the event for the user.
     * @param session - extra session information to be used by the service. For XSRF protection.
     * @return The updated event attached to the user.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the event has been deleted, it raises {@link DeletedEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     */
    updateEvent(session: Session, updateOptions: UpdateEventOptions): Promise<Event>;

    /**
     * Retrieve the event for the user.
     * @return The event for the user.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the event has been deleted, it raises {@link DeletedEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     */
    getEvent(): Promise<Event>;
}


// /**
//  * Create a {@link ContentPrivateClient}.
//  * @param env - the {@link Env} the client is running in.
//  * @param origin - the [origin]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin}
//  *     to use for the requests originating from the client. Doesn't "change" things for browser work.
//  * @param contentServiceHost - the hostname for the content service servers.
//  * @param webFetcher - a {@link WebFetcher} to use to make requests.
//  * @return a new {@link ContentPrivateClient}. On server there's no context, whereas on the browser it's implied.
//  */
// export function newContentPrivateClient(
//     env: Env,
//     origin: string,
//     identityServiceHost: string,
//     webFetcher: WebFetcher): ContentPrivateClient {
//     const sessionTokenMarshaller = new (MarshalFrom(SessionToken))();
//     const sessionAndTokenResponseMarshaller = new (MarshalFrom(SessionAndTokenResponse))();
//     const sessionResponseMarshaller = new (MarshalFrom(SessionResponse))();
//     const usersInfoResponseMarshaller = new (MarshalFrom(UsersInfoResponse))();

//     return new ContentPrivateClientImpl(
//         env,
//         origin,
//         identityServiceHost,
//         webFetcher,
//         sessionTokenMarshaller,
//         sessionAndTokenResponseMarshaller,
//         sessionResponseMarshaller,
//         usersInfoResponseMarshaller);
// }


// class ContentPrivateClientImpl implements ContentPrivateClient {
//     private static readonly _getOrCreateSessionOptions: RequestInit = {
//         method: 'POST',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private static readonly _getSessionOptions: RequestInit = {
//         method: 'GET',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private static readonly _expireSessionOptions: RequestInit = {
//         method: 'DELETE',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private static readonly _agreeToCookiePolicyForSessionOptions: RequestInit = {
//         method: 'POST',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private static readonly _getOrCreateUserOnSessionOptions: RequestInit = {
//         method: 'POST',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private static readonly _getUserOnSessionOptions: RequestInit = {
//         method: 'GET',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private static readonly _getUsersInfoOptions: RequestInit = {
//         method: 'GET',
//         cache: 'no-cache',
//         redirect: 'error',
//         referrer: 'client',
//     };

//     private readonly _env: Env;
//     private readonly _origin: string;
//     private readonly _identityServiceHost: string;
//     private readonly _webFetcher: WebFetcher;
//     private readonly _sessionTokenMarshaller: Marshaller<SessionToken>;
//     private readonly _sessionAndTokenResponseMarshaller: Marshaller<SessionAndTokenResponse>;
//     private readonly _sessionResponseMarshaller: Marshaller<SessionResponse>;
//     private readonly _usersInfoResponseMarshaller: Marshaller<UsersInfoResponse>;
//     private readonly _defaultHeaders: HeadersInit;
//     private readonly _protocol: string;

//     constructor(
//         env: Env,
//         origin: string,
//         identityServiceHost: string,
//         webFetcher: WebFetcher,
//         sessionTokenMarshaller: Marshaller<SessionToken>,
//         sessionAndTokenResponseMarshaler: Marshaller<SessionAndTokenResponse>,
//         sessionResponseMarshaller: Marshaller<SessionResponse>,
//         usersInfoResponseMarshaller: Marshaller<UsersInfoResponse>,
//         sessionToken: SessionToken | null = null) {
//         this._env = env;
//         this._origin = origin;
//         this._identityServiceHost = identityServiceHost;
//         this._webFetcher = webFetcher;
//         this._sessionTokenMarshaller = sessionTokenMarshaller;
//         this._sessionAndTokenResponseMarshaller = sessionAndTokenResponseMarshaler
//         this._sessionResponseMarshaller = sessionResponseMarshaller;
//         this._usersInfoResponseMarshaller = usersInfoResponseMarshaller;

//         this._defaultHeaders = {
//             'Origin': origin
//         }

//         if (sessionToken != null) {
//             this._defaultHeaders[SESSION_TOKEN_HEADER_NAME] = JSON.stringify(this._sessionTokenMarshaller.pack(sessionToken));
//         }

//         if (isLocal(this._env)) {
//             this._protocol = 'http';
//         } else {
//             this._protocol = 'https';
//         }
//     }

//     withContext(sessionToken: SessionToken): IdentityClient {
//         return new IdentityClientImpl(
//             this._env,
//             this._origin,
//             this._identityServiceHost,
//             this._webFetcher,
//             this._sessionTokenMarshaller,
//             this._sessionAndTokenResponseMarshaller,
//             this._sessionResponseMarshaller,
//             this._usersInfoResponseMarshaller,
//             sessionToken);
//     }

//     async getOrCreateSession(): Promise<[SessionToken, Session]> {
//         const options = this._buildOptions(IdentityClientImpl._getOrCreateSessionOptions);

//         let rawResponse: Response;
//         try {
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/session`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             try {
//                 const jsonResponse = await rawResponse.json();
//                 const sessionResponse = this._sessionAndTokenResponseMarshaller.extract(jsonResponse);
//                 return [sessionResponse.sessionToken, sessionResponse.session];
//             } catch (e) {
//                 throw new IdentityError(`JSON decoding error because '${e.toString()}'`);
//             }
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     async getSession(): Promise<Session> {
//         const options = this._buildOptions(IdentityClientImpl._getSessionOptions);

//         let rawResponse: Response;
//         try {
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/session`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             try {
//                 const jsonResponse = await rawResponse.json();
//                 const sessionResponse = this._sessionResponseMarshaller.extract(jsonResponse);
//                 return sessionResponse.session;
//             } catch (e) {
//                 throw new IdentityError(`JSON decoding error because '${e.toString()}'`);
//             }
//         } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
//             throw new UnauthorizedIdentityError('User is not authorized');
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     async removeSession(session: Session): Promise<void> {
//         const options = this._buildOptions(IdentityClientImpl._expireSessionOptions, session);

//         let rawResponse: Response;
//         try {
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/session`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             // Do nothing
//         } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
//             throw new UnauthorizedIdentityError('User is not authorized');
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     async agreeToCookiePolicyForSession(session: Session): Promise<Session> {
//         const options = this._buildOptions(IdentityClientImpl._agreeToCookiePolicyForSessionOptions, session);

//         let rawResponse: Response;
//         try {
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/session/agree-to-cookie-policy`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             try {
//                 const jsonResponse = await rawResponse.json();
//                 const sessionResponse = this._sessionResponseMarshaller.extract(jsonResponse);
//                 return sessionResponse.session;
//             } catch (e) {
//                 throw new IdentityError(`JSON decoding error because '${e.toString()}'`);
//             }
//         } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
//             throw new UnauthorizedIdentityError('User is not authorized');
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     async getOrCreateUserOnSession(session: Session): Promise<[SessionToken, Session]> {
//         const options = this._buildOptions(IdentityClientImpl._getOrCreateUserOnSessionOptions, session);

//         let rawResponse: Response;
//         try {
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/user`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             try {
//                 const jsonResponse = await rawResponse.json();
//                 const sessionResponse = this._sessionAndTokenResponseMarshaller.extract(jsonResponse);
//                 return [sessionResponse.sessionToken, sessionResponse.session];
//             } catch (e) {
//                 throw new IdentityError(`JSON decoding error because '${e.toString()}'`);
//             }
//         } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
//             throw new UnauthorizedIdentityError('User is not authorized');
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     async getUserOnSession(): Promise<Session> {
//         const options = this._buildOptions(IdentityClientImpl._getUserOnSessionOptions);

//         let rawResponse: Response;
//         try {
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/user`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             try {
//                 const jsonResponse = await rawResponse.json();
//                 const sessionResponse = this._sessionResponseMarshaller.extract(jsonResponse);
//                 return sessionResponse.session;
//             } catch (e) {
//                 throw new IdentityError(`JSON decoding error because '${e.toString()}'`);
//             }
//         } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
//             throw new UnauthorizedIdentityError('User is not authorized');
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     async getUsersInfo(ids: number[]): Promise<PublicUser[]> {
//         const dedupedIds: number[] = [];
//         for (let id of ids) {
//             if (dedupedIds.indexOf(id) != -1)
//                 continue;
//             dedupedIds.push(id);
//         }

//         const options = this._buildOptions(IdentityClientImpl._getUsersInfoOptions);

//         let rawResponse: Response;
//         try {
//             const encodedIds = encodeURIComponent(JSON.stringify(dedupedIds));
//             rawResponse = await this._webFetcher.fetch(`${this._protocol}://${this._identityServiceHost}/users-info?ids=${encodedIds}`, options);
//         } catch (e) {
//             throw new IdentityError(`Request failed because '${e.toString()}'`);
//         }

//         if (rawResponse.ok) {
//             try {
//                 const jsonResponse = await rawResponse.json();
//                 const usersInfoResponse = this._usersInfoResponseMarshaller.extract(jsonResponse);
//                 return usersInfoResponse.usersInfo;
//             } catch (e) {
//                 throw new IdentityError(`JSON decoding error because '${e.toString()}'`);
//             }
//         } else {
//             throw new IdentityError(`Service response ${rawResponse.status}`);
//         }
//     }

//     private _buildOptions(template: RequestInit, session: Session | null = null) {
//         const options = (Object as any).assign({ headers: this._defaultHeaders }, template);

//         if (session != null) {
//             options.headers = (Object as any).assign(options.headers, { [XSRF_TOKEN_HEADER_NAME]: session.xsrfToken });
//         }

//         return options;
//     }
// }
