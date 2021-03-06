/** The client definitions for interacting with the content service. */

/** Imports. Also so typedoc works correctly. */
import 'isomorphic-fetch'
import * as HttpStatus from 'http-status-codes'
import { Marshaller, MarshalFrom } from 'raynor'

import { WebFetcher } from '@truesparrow/common-js'
import { Session } from '@truesparrow/identity-sdk-js'
import {
    SESSION_TOKEN_HEADER_NAME,
    XSRF_TOKEN_HEADER_NAME
} from '@truesparrow/identity-sdk-js/client'
import { SessionToken } from '@truesparrow/identity-sdk-js/session-token'

import {
    ChargebeeManagePageResponse,
    CheckSubDomainAvailableResponse,
    CreateEventRequest,
    PrivateEventResponse,
    PrivateEventResponseMarshaller,
    PublicEventResponse,
    UpdateEventRequest
} from './dtos'
import { Event, EventPlan, PictureSet, SubEventDetails } from './entities'


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
export class EventRemovedError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'EventRemovedError';
    }
}

/** An error raised when an action is by an user without an event. */
export class EventNotFoundError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'EventNotFoundError';
    }
}

/** An error raised when an action is by an user without an event. */
export class EventAlreadyExistsForUserError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'EventAlreadyExistsForUserError';
    }
}

/** Error raised when a subdomain is already used. */
export class SubDomainInUseError extends ContentError {
    constructor(message: string) {
        super(message);
        this.name = 'SubDomainInUseError';
    }
}


/** Things to update. */
export interface UpdateEventOptions {
    title?: string;
    pictureSet?: PictureSet;
    subEventDetails?: SubEventDetails[];
    subDomain?: string;
}

/**
 * A client for interacting with the content service, but from a public context. This is meant for
 * guests interaction with a user's event. So it contains only read-only operations, or things
 * which only affect linked data for the event, but never the event itself.
 * @note There is a notion of call context, which is the user's identity. In a browser/client
 * environment this is implicit, and provided by standard methods (cookies). In a server
 * environment, this must be made explicit, via the {@link withContext} call.
 * @note Things won't be relative to the current user, but rather to the event the current user
 * is interacting with.
 */
export interface ContentPublicClient {
    /**
     * Attach a {@link SessionToken} to the client, as an explicit context for future calls.
     * @param sessionToken - add this token to all calls made by the resulting client.
     * @return A new client, with the session token attached.
     */
    withContext(sessionToken: SessionToken): ContentPublicClient;

    /**
     * Retrieve the event starting from a subdomain.
     * @note Events which are inactive or removed are not returned. The thing must
     * be {@link EventState.Active}.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     * @return The event at the subdomain.
     */
    getEventBySubDomain(subDomain: string): Promise<Event>;
}

/**
 * Create a {@link ContentPublicClient}.
 * @param origin - the [origin]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin}
 *     to use for the requests originating from the client. Doesn't "change" things for browser work.
 * @param contentServiceHost - the hostname for the content service servers.
 * @param webFetcher - a {@link WebFetcher} to use to make requests.
 * @return a new {@link ContentPublicClient}. On server there's no context, whereas on the browser it's implied.
 */
export function newContentPublicClient(
    origin: string,
    contentServiceHost: string,
    webFetcher: WebFetcher): ContentPublicClient {
    const sessionTokenMarshaller = new (MarshalFrom(SessionToken))();
    const publicEventResponseMarshaller = new (MarshalFrom(PublicEventResponse))();

    return new ContentPublicClientImpl(
        origin,
        contentServiceHost,
        webFetcher,
        sessionTokenMarshaller,
        publicEventResponseMarshaller);
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
     * @param plan - the plan for the event.
     * @return The new event attached to the user.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    createEvent(session: Session, plan: EventPlan): Promise<Event>;

    /**
     * Update the event for the user.
     * @param session - extra session information to be used by the service. For XSRF protection.
     * @param updateOptions - things to update.
     * @return The updated event attached to the user.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When an update on the subdomain is attempted, but the subdomain is already in use, it
     *     raises {@link SubDomainInUseError}.
     * @throws When the event has been deleted, it raises {@link DeletedEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    updateEvent(session: Session, updateOptions: UpdateEventOptions): Promise<Event>;

    /**
     * Remove the event for the user.
     * @param session - extra session information to be used by the service. For XSRF protection.
     * @return nothing
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the event has been deleted, it raises {@link DeletedEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    deleteEvent(session: Session): Promise<void>;

    /**
     * Mark the UI state of showing the setup wizard as done
     * @param session - extra session information to be used by the service. For XSRF protection
     * @return The updated event attached to the user.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the event has been deleted, it raises {@link DeletedEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    uiMarkSkippedSetupWizard(session: Session): Promise<Event>;

    /**
     * Retrieve the event for the user.
     * @return The event for the user.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the event has been deleted, it raises {@link DeletedEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    getEvent(): Promise<Event>;

    /**
     * Check whether a subdomain is available for an event or not.
     * @param subDomain - the domain to check.
     * @return Whether the domain is available for grabs or not.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    checkSubDomainAvailable(subDomain: string): Promise<boolean>;

    /**
     * Get the URI for the Chargebee management page.
     * @return The URI for the Chargebee management page.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     * @throws When something bad happens in the communication, it raises {@link ContentError}.
     */
    getChargebeeManagePageUri(): Promise<string>;
}


/**
 * Create a {@link ContentPrivateClient}.
 * @param origin - the [origin]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin}
 *     to use for the requests originating from the client. Doesn't "change" things for browser work.
 * @param contentServiceHost - the hostname for the content service servers.
 * @param webFetcher - a {@link WebFetcher} to use to make requests.
 * @return a new {@link ContentPrivateClient}. On server there's no context, whereas on the browser it's implied.
 */
export function newContentPrivateClient(
    origin: string,
    contentServiceHost: string,
    webFetcher: WebFetcher): ContentPrivateClient {
    const sessionTokenMarshaller = new (MarshalFrom(SessionToken))();
    const createEventRequestMarshaller = new (MarshalFrom(CreateEventRequest))();
    const updateEventRequestMarshaller = new (MarshalFrom(UpdateEventRequest))();
    const privateEventResponseMarshaller = new PrivateEventResponseMarshaller();
    const checkSubDomainAvailableResponseMarshaller = new (MarshalFrom(CheckSubDomainAvailableResponse))();
    const chargebeeManagePageResponse = new (MarshalFrom(ChargebeeManagePageResponse))();

    return new ContentPrivateClientImpl(
        origin,
        contentServiceHost,
        webFetcher,
        sessionTokenMarshaller,
        createEventRequestMarshaller,
        updateEventRequestMarshaller,
        privateEventResponseMarshaller,
        checkSubDomainAvailableResponseMarshaller,
        chargebeeManagePageResponse);
}


class ContentPrivateClientImpl implements ContentPrivateClient {
    private static readonly _createEventOptions: RequestInit = {
        method: 'POST',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _updateEventOptions: RequestInit = {
        method: 'PUT',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _deleteEventOptions: RequestInit = {
        method: 'DELETE',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _uiMarkSkippedSetupWizard: RequestInit = {
        method: 'PUT',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getEventOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _checkSubDomainAvailableOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private static readonly _getChargebeeManagementPageUriOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private readonly _origin: string;
    private readonly _contentServiceHost: string;
    private readonly _webFetcher: WebFetcher;
    private readonly _sessionTokenMarshaller: Marshaller<SessionToken>;
    private readonly _createEventRequestMarshaller: Marshaller<CreateEventRequest>;
    private readonly _updateEventRequestMarshaller: Marshaller<UpdateEventRequest>;
    private readonly _privateEventResponseMarshaller: Marshaller<PrivateEventResponse>;
    private readonly _checkSubDomainAvailableResponseMarshaller: Marshaller<CheckSubDomainAvailableResponse>;
    private readonly _chargebeeManagePageResponseMarshaller: Marshaller<ChargebeeManagePageResponse>;
    private readonly _defaultHeaders: HeadersInit;

    constructor(
        origin: string,
        contentServiceHost: string,
        webFetcher: WebFetcher,
        sessionTokenMarshaller: Marshaller<SessionToken>,
        createEventRequestMarshaller: Marshaller<CreateEventRequest>,
        updateEventRequestMarshaller: Marshaller<UpdateEventRequest>,
        privateEventResponseMarshaller: Marshaller<PrivateEventResponse>,
        checkSubDomainAvailableResponseMarshaller: Marshaller<CheckSubDomainAvailableResponse>,
        chargebeeManagePageResponseMarshaller: Marshaller<ChargebeeManagePageResponse>,
        sessionToken: SessionToken | null = null) {
        this._origin = origin;
        this._contentServiceHost = contentServiceHost;
        this._webFetcher = webFetcher;
        this._sessionTokenMarshaller = sessionTokenMarshaller;
        this._createEventRequestMarshaller = createEventRequestMarshaller;
        this._updateEventRequestMarshaller = updateEventRequestMarshaller;
        this._privateEventResponseMarshaller = privateEventResponseMarshaller;
        this._chargebeeManagePageResponseMarshaller = chargebeeManagePageResponseMarshaller;
        this._checkSubDomainAvailableResponseMarshaller = checkSubDomainAvailableResponseMarshaller;

        this._defaultHeaders = {
            'Origin': origin
        }

        if (sessionToken != null) {
            this._defaultHeaders[SESSION_TOKEN_HEADER_NAME] = JSON.stringify(this._sessionTokenMarshaller.pack(sessionToken));
        }
    }

    withContext(sessionToken: SessionToken): ContentPrivateClient {
        return new ContentPrivateClientImpl(
            this._origin,
            this._contentServiceHost,
            this._webFetcher,
            this._sessionTokenMarshaller,
            this._createEventRequestMarshaller,
            this._updateEventRequestMarshaller,
            this._privateEventResponseMarshaller,
            this._checkSubDomainAvailableResponseMarshaller,
            this._chargebeeManagePageResponseMarshaller,
            sessionToken);
    }

    async createEvent(session: Session, plan: EventPlan): Promise<Event> {
        const createEventRequest = new CreateEventRequest();
        createEventRequest.plan = plan;

        const options = this._buildOptions(ContentPrivateClientImpl._createEventOptions, session);
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(this._createEventRequestMarshaller.pack(createEventRequest));

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`http://${this._contentServiceHost}/api/private/events`, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const privateEventResponse = this._privateEventResponseMarshaller.extract(jsonResponse);
                return privateEventResponse.event as Event;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.CONFLICT) {
            throw new EventAlreadyExistsForUserError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    async updateEvent(session: Session, updateOptions: UpdateEventOptions): Promise<Event> {
        const updateEventRequest = new UpdateEventRequest();

        // Hackety-hack-hack
        for (let key in updateOptions) {
            (updateEventRequest as any)[key] = (updateOptions as any)[key];
        }

        const options = this._buildOptions(ContentPrivateClientImpl._updateEventOptions, session);
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(this._updateEventRequestMarshaller.pack(updateEventRequest));

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`http://${this._contentServiceHost}/api/private/events`, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const privateEventResponse = this._privateEventResponseMarshaller.extract(jsonResponse);

                if (privateEventResponse.eventIsRemoved) {
                    throw new EventRemovedError('Event already deleted');
                }

                return privateEventResponse.event as Event;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.CONFLICT) {
            throw new SubDomainInUseError('Subdomain is already in use');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new EventNotFoundError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    async deleteEvent(session: Session): Promise<void> {
        const options = this._buildOptions(ContentPrivateClientImpl._deleteEventOptions, session);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`http://${this._contentServiceHost}/api/private/events`, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            return;
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new EventNotFoundError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    async uiMarkSkippedSetupWizard(session: Session): Promise<Event> {
        const options = this._buildOptions(ContentPrivateClientImpl._uiMarkSkippedSetupWizard, session);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`http://${this._contentServiceHost}/api/private/events/ui-mark-skipped-setup-wizard`, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const privateEventResponse = this._privateEventResponseMarshaller.extract(jsonResponse);

                if (privateEventResponse.eventIsRemoved) {
                    throw new EventRemovedError('Event already deleted');
                }

                return privateEventResponse.event as Event;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new EventNotFoundError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    async getEvent(): Promise<Event> {
        const options = this._buildOptions(ContentPrivateClientImpl._getEventOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`http://${this._contentServiceHost}/api/private/events`, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const privateEventReasponse = this._privateEventResponseMarshaller.extract(jsonResponse);

                if (privateEventReasponse.eventIsRemoved) {
                    throw new EventRemovedError('Event already deleted');
                }

                return privateEventReasponse.event as Event;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new EventNotFoundError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    async checkSubDomainAvailable(subDomain: string): Promise<boolean> {
        const options = this._buildOptions(ContentPrivateClientImpl._checkSubDomainAvailableOptions);

        let rawResponse: Response;
        try {
            const encodedSubDomain = encodeURIComponent(subDomain);
            const apiUri = `http://${this._contentServiceHost}/api/private/check-subdomain-available?subdomain=${encodedSubDomain}`;
            rawResponse = await this._webFetcher.fetch(apiUri, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const checkSubDomainAvailableResponse = this._checkSubDomainAvailableResponseMarshaller.extract(jsonResponse);

                return checkSubDomainAvailableResponse.available;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    async getChargebeeManagePageUri(): Promise<string> {
        const options = this._buildOptions(ContentPrivateClientImpl._getChargebeeManagementPageUriOptions);

        let rawResponse: Response;
        try {
            rawResponse = await this._webFetcher.fetch(`http://${this._contentServiceHost}/api/private/events/chargebee-management-page-uri`, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const chargebeeManagementPageUriResponse = this._chargebeeManagePageResponseMarshaller.extract(jsonResponse);

                return chargebeeManagementPageUriResponse.manageAccountUri;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new EventNotFoundError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    private _buildOptions(template: RequestInit, session: Session | null = null) {
        const options = (Object as any).assign({ headers: this._defaultHeaders }, template);

        if (session != null) {
            options.headers = (Object as any).assign(options.headers, { [XSRF_TOKEN_HEADER_NAME]: session.xsrfToken });
        }

        return options;
    }
}

class ContentPublicClientImpl implements ContentPublicClient {
    private static readonly _getEventBySubDomainOptions: RequestInit = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        referrer: 'client',
    };

    private readonly _origin: string;
    private readonly _contentServiceHost: string;
    private readonly _webFetcher: WebFetcher;
    private readonly _sessionTokenMarshaller: Marshaller<SessionToken>;
    private readonly _publicEventResponseMarshaller: Marshaller<PublicEventResponse>;
    private readonly _defaultHeaders: HeadersInit;

    constructor(
        origin: string,
        contentServiceHost: string,
        webFetcher: WebFetcher,
        sessionTokenMarshaller: Marshaller<SessionToken>,
        publicEventResponseMarshaller: Marshaller<PublicEventResponse>,
        sessionToken: SessionToken | null = null) {
        this._origin = origin;
        this._contentServiceHost = contentServiceHost;
        this._webFetcher = webFetcher;
        this._sessionTokenMarshaller = sessionTokenMarshaller;
        this._publicEventResponseMarshaller = publicEventResponseMarshaller;

        this._defaultHeaders = {
            'Origin': origin
        }

        if (sessionToken != null) {
            this._defaultHeaders[SESSION_TOKEN_HEADER_NAME] = JSON.stringify(this._sessionTokenMarshaller.pack(sessionToken));
        }
    }

    withContext(sessionToken: SessionToken): ContentPublicClient {
        return new ContentPublicClientImpl(
            this._origin,
            this._contentServiceHost,
            this._webFetcher,
            this._sessionTokenMarshaller,
            this._publicEventResponseMarshaller,
            sessionToken);
    }

    async getEventBySubDomain(subDomain: string): Promise<Event> {
        const options = this._buildOptions(ContentPublicClientImpl._getEventBySubDomainOptions);

        let rawResponse: Response;
        try {
            const encodedSubDomain = encodeURIComponent(subDomain);
            const apiUri = `http://${this._contentServiceHost}/api/public/events?subdomain=${encodedSubDomain}`;
            rawResponse = await this._webFetcher.fetch(apiUri, options);
        } catch (e) {
            throw new ContentError(`Request failed because '${e.toString()}'`);
        }

        if (rawResponse.ok) {
            try {
                const jsonResponse = await rawResponse.json();
                const publicEventReasponse = this._publicEventResponseMarshaller.extract(jsonResponse);

                return publicEventReasponse.event as Event;
            } catch (e) {
                throw new ContentError(`JSON decoding error because '${e.toString()}'`);
            }
        } else if (rawResponse.status == HttpStatus.UNAUTHORIZED) {
            throw new UnauthorizedContentError('User is not authorized');
        } else if (rawResponse.status == HttpStatus.NOT_FOUND) {
            throw new EventNotFoundError('User does not have a cause');
        } else {
            throw new ContentError(`Service response ${rawResponse.status}`);
        }
    }

    private _buildOptions(template: RequestInit, session: Session | null = null) {
        const options = (Object as any).assign({ headers: this._defaultHeaders }, template);

        if (session != null) {
            options.headers = (Object as any).assign(options.headers, { [XSRF_TOKEN_HEADER_NAME]: session.xsrfToken });
        }

        return options;
    }
}
