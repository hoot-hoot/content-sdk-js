/** The client definitions for interacting with the content service. */

/** Imports. Also so typedoc works correctly. */
import 'isomorphic-fetch'

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
 * @note There is a notion of call context, with is the user's identity. In a browser/client
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
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     */
    updateEvent(session: Session, updateOptions: UpdateEventOptions): Promise<Event>;

    /**
     * Retrieve the event for the user.
     * @return The event for the user.
     * @throws When the event does not exist, it raises {@link NoEventForUserError}.
     * @throws When the user is not authorized to perform the action, it raises {@link UnauthorizedContentError}.
     */
    getEvent(): Promise<Event>;
}
