/** Data transfer objects for client-server communication. Shouldn't be used by externals. */

/** Imports. Also so typedoc works correctly. */
import * as r from 'raynor'
import {
    ExtractError,
    Marshaller,
    MarshalFrom,
    MarshalWith,
    ObjectMarshaller,
    OptionalOf
} from 'raynor'

import { Event, SubEventDetails } from './entities'


/** The data associated with a creation request. */
export class CreateEventRequest {
}

/** The data associated with an update request. */
export class UpdateEventRequest {
    @MarshalWith(OptionalOf(MarshalFrom(SubEventDetails)))
    subEventDetails: SubEventDetails[] | null;
}


/** The response data for many private client APIs. */
export class PrivateEventResponse {
    @MarshalWith(r.BooleanMarshaller)
    eventIsRemoved: boolean;

    @MarshalWith(OptionalOf(MarshalFrom(Event)))
    event: Event | null;
}


/**
 * A marshaller for {@link PrivateEventResponse}. Does a bit more than a standard object marshaller.
 * For example, it makes sure that when the event is removed there's really no data attached.
 */
export class PrivateEventResponseMarshaller implements Marshaller<PrivateEventResponse> {
    // Should be extends MarshalFrom(PrivateEventResponse). Typescript doesn't yet support that.
    private static readonly _basicMarshaller: ObjectMarshaller<PrivateEventResponse> = new (MarshalFrom(PrivateEventResponse))();

    extract(raw: any): PrivateEventResponse {
        const response = PrivateEventResponseMarshaller._basicMarshaller.extract(raw);

        if (response.eventIsRemoved && response.event != null) {
            throw new ExtractError('Expected no event when it is removed');
        }

        if (!response.eventIsRemoved && response.event == null) {
            throw new ExtractError('Expected a event when it is not removed');
        }

        return response;
    }

    pack(response: PrivateEventResponse): any {
        return PrivateEventResponseMarshaller._basicMarshaller.pack(response);
    }
}
