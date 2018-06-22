/** Data transfer objects for client-server communication. Shouldn't be used by externals. */

/** Imports. Also so typedoc works correctly. */
import * as r from 'raynor'
import {
    ArrayOf,
    ExtractError,
    Marshaller,
    MarshalFrom,
    MarshalWith,
    ObjectMarshaller,
    OptionalOf
} from 'raynor'

import {
    Event,
    EventPlan,
    PictureSet,
    PictureSetMarshaller,
    SubDomainMarshaller,
    SubEventDetails,
    TitleMarshaller
} from './entities'


/** The data associated with a creation request. */
export class CreateEventRequest {
    /** The plan the event is using. */
    @MarshalWith(r.StringMarshaller)
    plan: EventPlan;
}

/** The data associated with an update request. */
export class UpdateEventRequest {
    /** An optional title to use. */
    @MarshalWith(OptionalOf(TitleMarshaller))
    title: string | null;

    /** An optional set of pictures to specify. */
    @MarshalWith(OptionalOf(PictureSetMarshaller))
    pictureSet: PictureSet | null;

    /** An optional set of subevents to specify. */
    @MarshalWith(OptionalOf(ArrayOf(MarshalFrom(SubEventDetails))))
    subEventDetails: SubEventDetails[] | null;

    /** An optional subdomain to use. */
    @MarshalWith(OptionalOf(SubDomainMarshaller))
    subDomain: string | null;
}

/** The response data for many public client APIs. */
export class PublicEventResponse {
    @MarshalWith(MarshalFrom(Event))
    event: Event;
}

/** The response data for many private client APIs. */
export class PrivateEventResponse {
    /** Whether the event was removed or not. If true, {@link event} must be null. */
    @MarshalWith(r.BooleanMarshaller)
    eventIsRemoved: boolean;

    /** An optional event. */
    @MarshalWith(OptionalOf(MarshalFrom(Event)))
    event: Event | null;
}

/** The response data for the checkSubDomainAvailable method. */
export class CheckSubDomainAvailableResponse {
    /** Whether the event is available or not. */
    @MarshalWith(r.BooleanMarshaller)
    available: boolean;
}

/** Details for subscription management via Chargebee */
export class ChargebeeManagePageResponse {
    /** The manage hosted page account. */
    @MarshalWith(r.SecureWebUriMarshaller)
    manageAccountUri: string;
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
