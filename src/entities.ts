/** The core entities of the content service. */

/** Imports. Also so typedoc works correctly. */
import { MarshalWith } from 'raynor'
import * as r from 'raynor'


/** Details about a sub-event of the main event. */
export class SubEventDetails {
    @MarshalWith(r.BooleanMarshaller)
    haveEvent: boolean;

    @MarshalWith(r.StringMarshaller)
    address: string;

    @MarshalWith(r.ArrayOf(r.NumberMarshaller))
    coordinates: [number, number];

    @MarshalWith(r.DateFromTsMarshaller)
    dateAndTime: Date;
}
