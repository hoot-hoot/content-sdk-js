/** The core entities of the content service. */

/** Imports. Also so typedoc works correctly. */
import {
    ArrayOf,
    ExtractError,
    Marshaller,
    MarshalEnum,
    MarshalFrom,
    MarshalWith
} from 'raynor'
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


/** An uploaded picture from a user. */
export class Picture {
    /** The default width of an image in px. Expect all images to be of this size. */
    public static readonly DEFAULT_WIDTH: number = 1600;
    /** The default height of an image in px. Expect all images to be of this size. */
    public static readonly DEFAULT_HEIGHT: number = 900;

    /** The position of the picture in a {@link PictureSet}. */
    @MarshalWith(r.PositiveIntegerMarshaller)
    position: number;

    /**
     * The URI where the image can be viewed. It has to be secure one, but not necessarily from
     * truesparrow
     */
    @MarshalWith(r.SecureWebUriMarshaller)
    uri: string;

    /** The width of the image. Currently defaults to {@link Picture.DEFAULT_WIDTH}. */
    @MarshalWith(r.PositiveIntegerMarshaller)
    width: number;

    /** The height of the image. Currently defaults to {@link Picture.DEFAULT_HEIGHT}. */
    @MarshalWith(r.PositiveIntegerMarshaller)
    height: number;
}


/** The set of images for a user. */
export class PictureSet {
    /** The current maximum number of images for a user. */
    public static readonly MAX_NUMBER_OF_PICTURES = 25;

    /** The set of pictures. */
    @MarshalWith(ArrayOf(MarshalFrom(Picture)))
    pictures: Picture[];
}


/**
 * A marshaller of {@link PictureSet}s. Ensures no more than
 * {@link PictureSet.MAX_NUMBER_OF_PICTURES} are present.
 */
export class PictureSetMarshaller implements Marshaller<PictureSet> {
    private static readonly _basicMarshaller = new (MarshalFrom(PictureSet))();

    extract(raw: any): PictureSet {
        const pictureSet = PictureSetMarshaller._basicMarshaller.extract(raw);

        if (pictureSet.pictures.length > PictureSet.MAX_NUMBER_OF_PICTURES) {
            throw new ExtractError('Expected less than MAX_NUMBER_OF_PICTURES');
        }

        for (let i = 0; i < pictureSet.pictures.length; i++) {
            if (pictureSet.pictures[i].position != i + 1) {
                throw new ExtractError(`Expected picture {i} position to follow the pattern`);
            }
        }

        return pictureSet;
    }

    pack(pictureSet: PictureSet): any {
        return PictureSetMarshaller._basicMarshaller.pack(pictureSet);
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

    /** The set of pictures for the event. */
    @MarshalWith(PictureSetMarshaller)
    pictureSet: PictureSet;

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
     * @note For now, this looks to see if there's any subevent which is allowed and if there are
     *     some pictures.
     * @return Whether the event looks active or not.
     */
    get doesLookActive(): boolean {
        if (this.pictureSet.pictures.length == 0) {
            return false;
        }

        if (this.subEventDetails.every(sed => !sed.haveEvent)) {
            return false;
        }

        return true;
    }
}
