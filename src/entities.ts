/** The core entities of the content service. */

/** Imports. Also so typedoc works correctly. */
import { ArrayOf, ExtractError, MarshalEnum, MarshalFrom, MarshalWith } from 'raynor'
import * as r from 'raynor'


/**
 * A marshaller for strings which represent addresses. We can't really have more structure on
 * these, unfortunately. Just that they're not 0, 1 or 2 characters.
 */
export class AddressMarshaller extends r.StringMarshaller {
    filter(s: string): string {
        if (s.length < 3) {
            throw new ExtractError('String is too short to be an address');
        }

        return s;
    }
}


/** Details about a sub-event of the main event. */
export class SubEventDetails {
    /** Whether to hold the event or not. */
    @MarshalWith(r.BooleanMarshaller)
    haveEvent: boolean;

    /** The address of a user. Must be longer than three characters. */
    @MarshalWith(AddressMarshaller)
    address: string;

    @MarshalWith(r.ArrayOf(r.NumberMarshaller))
    coordinates: [number, number];

    @MarshalWith(r.DateFromTsMarshaller)
    dateAndTime: Date;
}


/** The state of an event. */
export enum EventState {
    /** Default value which should never be used. */
    Unknown = 0,

    /** The event was created, but not enough info is present to make it public. */
    Created = 1,

    /** The event is visible to people. */
    Active = 2,

    /** The event was removed by the user. */
    Removed = 3
}


/** Details about an event. */
export class Event {
    /** The globally unique id of the event. */
    @MarshalWith(r.IdMarshaller)
    id: number;

    /** The state of the event. */
    @MarshalWith(MarshalEnum(EventState))
    state: EventState;

    /** The various sub-events making up the event. */
    @MarshalWith(ArrayOf(MarshalFrom(SubEventDetails)))
    subEventDetails: SubEventDetails[]

    /** The time the event was created. */
    @MarshalWith(r.DateFromTsMarshaller)
    timeCreated: Date;

    /** The time the event was last updated. */
    @MarshalWith(r.DateFromTsMarshaller)
    timeLastUpdated: Date;

    /**
     * Checks whether the event looks active or not.
     * @note For now, this looks to see if there's any subevent which is allowed.
     * @return Whether the event looks active or not.
     */
    get doesLookActive(): boolean {
        if (this.subEventDetails.every(sed => !sed.haveEvent)) {
            return false;
        }

        return true;
    }
}
