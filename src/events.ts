/** The events of the content service. */

/** Imports. Also so typedoc works correctly. */
import * as r from 'raynor'
import {
    MarshalEnum,
    MarshalFrom,
    MarshalWith,
    OneOf2,
    OptionalOf
} from 'raynor'

import {
    CreateEventRequest,
    UpdateEventRequest
} from './dtos'


/** The types of events which happen on a {@link Event}. */
export enum EventEventType {
    /** The default value. Not meant to be used. */
    Unknown = 0,

    /** The creation event. */
    Created = 1,

    /** A generic update. Things like changing an address. */
    Updated = 2,

    /** Enough information is present after an update to make the site active. */
    Activated = 3,

    /** Not enough information is present after an update for the site to be active. */
    Deactivated = 4,

    /** The event was removed. */
    Removed = 5
}

/** An event for an {@link Event}. */
export class EventEvent {
    /** The globally unique id of the event. */
    @MarshalWith(r.IdMarshaller)
    id: number;

    /** The type of the event. */
    @MarshalWith(MarshalEnum(EventEventType))
    type: EventEventType;

    /** The time at which the event was recorded. */
    @MarshalWith(r.DateFromTsMarshaller)
    timestamp: Date;

    /** The data for the event. */
    @MarshalWith(OptionalOf(OneOf2(
        MarshalFrom(CreateEventRequest),
        MarshalFrom(UpdateEventRequest))))
    data: CreateEventRequest | UpdateEventRequest | null;
}
