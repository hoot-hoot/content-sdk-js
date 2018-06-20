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

import {
    Env,
    isNotOnServer,
    MessageWith0Arg,
    MessageWith0ArgMarshaller
} from '@truesparrow/common-js'


/** The custom error raised by the {@link SubDomainMarshaller}. */
export class ReasonedExtractError<E> extends ExtractError {
    reason: E;
    constructor(message: string, reason: E) {
        super(message);
        this.name = 'ReasonedExtractError';
        this.reason = reason;
    }
}

/** The reason the title was considered invalid. */
export enum TitleErrorReason {
    /** Nothing bad happened. */
    OK = 0,
    /** Lower level error. */
    LowerLevel = 1,
    /** The title has less than {@link TitleMarshaller.TITLE_MIN_SIZE} characters. */
    TooShort = 2,
    /** The title has more than {@link TitleMarshaller.TITLE_MAX_SIZE} characters. */
    TooLong = 3
}


/**
 * A marshaller for titles of all sorts.
 * TODO: improve all of the sizing information here!
 */
export class TitleMarshaller extends r.StringMarshaller {
    /** The minimum allowed size for a title. */
    public static readonly TITLE_MIN_SIZE = 4;
    /** The maximum allowed size for a title. */
    public static readonly TITLE_MAX_SIZE = 128;

    filter(s: string): string {
        var title = s.trim();

        if (title.length < TitleMarshaller.TITLE_MIN_SIZE) {
            throw new ReasonedExtractError<TitleErrorReason>(`Title "${s}" is too short`, TitleErrorReason.TooShort);
        }

        if (title.length > TitleMarshaller.TITLE_MAX_SIZE) {
            throw new ReasonedExtractError<TitleErrorReason>(`Title "${s}" is too long`, TitleErrorReason.TooLong);
        }

        return title;
    }

    verify(s: string): TitleErrorReason {
        try {
            this.extract(s);
            return TitleErrorReason.OK;
        } catch (e) {
            if (e.name == 'ReasonedExtractError') {
                return (e as ReasonedExtractError<TitleErrorReason>).reason;
            } else {
                return TitleErrorReason.LowerLevel;
            }
        }
    }
}

/** The reason the address was considered invalid. */
export enum AddressErrorReason {
    /** Nothing bad happened. */
    OK = 0,
    /** Lower level error. */
    LowerLevel = 1,
    /** The address was less than {@link AddressMarshaller.ADDRESS_MIN_SIZE} characters. */
    TooShort = 2
}


/**
 * A marshaller for strings which represent addresses. We can't really have more structure on
 * these, unfortunately. Just that they're not 0, 1 or 2 characters.
 */
export class AddressMarshaller extends r.StringMarshaller {
    /** The minimum size of an address. */
    public static readonly ADDRESS_MIN_SIZE = 3;

    filter(s: string): string {
        if (s.length < AddressMarshaller.ADDRESS_MIN_SIZE) {
            throw new ReasonedExtractError<AddressErrorReason>('String is too short to be an address', AddressErrorReason.TooShort);
        }

        return s;
    }

    verify(s: string): AddressErrorReason {
        try {
            this.extract(s);
            return AddressErrorReason.OK;
        } catch (e) {
            if (e.name == 'ReasonedExtractError') {
                return (e as ReasonedExtractError<AddressErrorReason>).reason;
            } else {
                return AddressErrorReason.LowerLevel;
            }
        }
    }
}


/** The reason a subdomain was considered invalid. */
export enum SubDomainErrorReason {
    /** Nothing bad happened. */
    OK = 0,
    /** Lower level error. */
    LowerLevel = 1,
    /** The subdomain has less than {@link Event.SUBDOMAIN_MIN_SIZE} chars. */
    TooShort = 2,
    /** The subdomain has more than {@link Event.SUBDOMAIN_MAX_SIZE} chars. */
    TooLong = 3,
    /** The subdomain contained invalid characters. */
    InvalidCharacters = 4
}


/**
 * A marshaller for subdomains. This is really restricted, only a-z or -, with
 * a letter being the first and last characters, and no more than one consecutive 0.
 */
export class SubDomainMarshaller extends r.StringMarshaller {
    /** The minimum allowed size for a subdomain. */
    public static readonly SUBDOMAIN_MIN_SIZE = 4;
    /** The maximum allowed size for a subdomain. */
    public static readonly SUBDOMAIN_MAX_SIZE = 58;

    private static readonly _subDomainRe: RegExp = new RegExp('^[a-z][-]?([a-z0-9]+-)*[a-z0-9]+$');

    filter(s: string): string {
        if (s.length < SubDomainMarshaller.SUBDOMAIN_MIN_SIZE) {
            throw new ReasonedExtractError(`Subdomain "${s}" is too short`, SubDomainErrorReason.TooShort);
        }

        if (s.length > SubDomainMarshaller.SUBDOMAIN_MAX_SIZE) {
            throw new ReasonedExtractError(`Subdomain "${s}" is too long`, SubDomainErrorReason.TooLong);
        }

        if (!SubDomainMarshaller._subDomainRe.test(s)) {
            throw new ReasonedExtractError(`Subdomain "${s}" is an invalid format`, SubDomainErrorReason.InvalidCharacters);
        }

        return s;
    }

    verify(s: string): SubDomainErrorReason {
        try {
            this.extract(s);
            return SubDomainErrorReason.OK;
        } catch (e) {
            if (e.name == 'ReasonedExtractError') {
                return (e as ReasonedExtractError<SubDomainErrorReason>).reason;
            } else {
                return SubDomainErrorReason.LowerLevel;
            }
        }
    }
}


/** A single image stored on a server. */
export class Image {
    /** The uri of the image. Not necessarily on truesparrow. */
    @MarshalWith(r.WebUriMarshaller)
    uri: string;

    /** The format of the image. Will be jpg. */
    @MarshalWith(r.StringMarshaller)
    format: string;

    /** The width of the image. */
    @MarshalWith(r.PositiveIntegerMarshaller)
    width: number;

    /** The height of the image. */
    @MarshalWith(r.PositiveIntegerMarshaller)
    height: number;
}


/** An uploaded picture from a user. */
export class Picture {
    /** The default format of images. */
    public static readonly FORMAT: string = 'jpg';
    /** The default width of an image in px. Expect all images to be of this size. */
    public static readonly MAIN_WIDTH: number = 1600;
    /** The default height of an image in px. Expect all images to be of this size. */
    public static readonly MAIN_HEIGHT: number = 900;
    /** The default width of the thumbnail image in px. Expect all thumbnails to be of this size. */
    public static readonly THUMBNAIL_WIDTH: number = 300;
    /** The default height of the thumbnail image in px. Expect all thumbnails to be of this size. */
    public static readonly THUMBNAIL_HEIGHT: number = 170;

    /** The position of the picture in a {@link PictureSet}. */
    @MarshalWith(r.PositiveIntegerMarshaller)
    position: number;

    /** The main image, the one intended for site display. */
    @MarshalWith(MarshalFrom(Image))
    mainImage: Image;

    /** A thumbnail image, for quick display in galleries etc. */
    @MarshalWith(MarshalFrom(Image))
    thumbnailImage: Image;
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


/** Details about the display and styling of sub-events. */
export class SubEventDisplayInfo {
    /** The icon to use for display. */
    @MarshalWith(r.StringMarshaller)
    icon: string;

    /** The main color. */
    @MarshalWith(r.StringMarshaller)
    color: string;
}


/** Details about a sub-event of the main event. */
export class SubEventDetails {
    /** Whether to hold the event or not. */
    @MarshalWith(r.BooleanMarshaller)
    haveEvent: boolean;

    /** The title of the sub event. */
    @MarshalWith(MessageWith0ArgMarshaller)
    title: MessageWith0Arg;

    /** A slug associated with the subevent. For use in UIs. Related to the title. */
    @MarshalWith(r.SlugMarshaller)
    slug: string;

    /** The address of a user. Must be longer than three characters. */
    @MarshalWith(AddressMarshaller)
    address: string;

    /** The coordinates where the thing takes place. Derived from address. */
    @MarshalWith(r.ArrayOf(r.NumberMarshaller))
    coordinates: [number, number];

    /** The date and time at which the event occurs. */
    @MarshalWith(r.DateFromTsMarshaller)
    dateAndTime: Date;

    /** Display and style information about the sub event. */
    @MarshalWith(MarshalFrom(SubEventDisplayInfo))
    display: SubEventDisplayInfo;

    /**
     * Checks whether the sub event looks active or not.
     * @note For now, this just checks that the title and slug are set to something,
     *     but doesn't look into the address and DateTime being more than whatever
     *     the marshallers enforce.
     * @return Whether the event looks active or not.
     */
    get doesLookActive(): boolean {
        if (Object.keys(this.title).length == 0) {
            return false;
        }

        for (let lang of Object.keys(this.title)) {
            if (this.title[lang].length == 0) {
                return false;
            }
        }

        if (this.slug.length == 0) {
            return false;
        }

        return true;
    }
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


/** UI information about an event. */
export class EventUiState {
    /** Whether to show the setup wizard or not in the admin interface. */
    @MarshalWith(r.BooleanMarshaller)
    showSetupWizard: boolean;
}

/** Plans */
export enum EventPlan {
    /** The quick starter plan. */
    QuickStarter = 'quick-starter',

    /** The long term thinker plan. */
    LongTermThinker = 'long-term-thinker'
}


/** Details about an event. */
export class Event {
    /** The globally unique id of the event. */
    @MarshalWith(r.IdMarshaller)
    id: number;

    /** The state of the event. */
    @MarshalWith(MarshalEnum(EventState))
    state: EventState;

    /** The title of the event. */
    @MarshalWith(TitleMarshaller)
    title: string;

    /** The set of pictures for the event. */
    @MarshalWith(PictureSetMarshaller)
    pictureSet: PictureSet;

    /** The various sub-events making up the event. */
    @MarshalWith(ArrayOf(MarshalFrom(SubEventDetails)))
    subEventDetails: SubEventDetails[];

    /** UI state for the event. */
    @MarshalWith(MarshalFrom(EventUiState))
    uiState: EventUiState;

    /** The plan for the event. */
    @MarshalWith(MarshalEnum(EventPlan))
    plan: EventPlan;

    /** The subdomain to use for the event. */
    @MarshalWith(SubDomainMarshaller)
    subDomain: string;

    /** The time the event was created. */
    @MarshalWith(r.DateFromTsMarshaller)
    timeCreated: Date;

    /** The time the event was last updated. */
    @MarshalWith(r.DateFromTsMarshaller)
    timeLastUpdated: Date;

    /**
     * Checks whether the event looks active or not.
     * @note For now, this looks to see if there's any subevent which is allowed and if there are
     *     some pictures. It also checks that the subevents which are enabled can be active.
     * @return Whether the event looks active or not.
     */
    get doesLookActive(): boolean {
        if (this.pictureSet.pictures.length == 0) {
            return false;
        }

        if (this.subEventDetails.every(sed => !sed.haveEvent)) {
            return false;
        }

        if (this.subEventDetails.filter(sed => sed.haveEvent).some(sed => !sed.doesLookActive)) {
            return false;
        }

        return true;
    }

    /**
     * Construct the public home URI of the event.
     * @param env - the environment we're considering.
     * @param siteFeHost - the host of the sitefe service.
     * @return The value of the public home URI.
     */
    homeUri(env: Env, siteFeHost: string): string {
        if (isNotOnServer(env)) {
            return `http://${this.subDomain}.${siteFeHost}/`;
        } else {
            return `https://${this.subDomain}.${siteFeHost}/`;
        }
    }
}
