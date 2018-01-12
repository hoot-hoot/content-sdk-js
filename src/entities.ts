/** The core entities of the content service. Thinks like {@link Post} and {@link Comment}. */

/** Imports. Also so typedoc works correctly. */


export enum BlogState {
    Unknown = 0,
    Created = 1,
    Active = 2,
    Archived = 3
}


export class BlogSettings {
    allowComments: boolean;
    allowAnonymousComments: boolean;
    useCommentsModeration: boolean;
}


export class Blog {
    id: number;
    state: BlogState;
    title: string;
    subdomain: string;
    ownerId: number;
    settings: BlogSettings;
    timeCreated: Date;
    timeLastUpdated: Date;
}


export enum PostType {
    Article,
    LinkSet,
    ImageSet
}


export enum PostState {
    Unknown = 0,
    Created = 1,
    Draft = 2,
    Published = 3,
    Archived = 4
}


export class Cell {
    index: number;
}


export class HeadingCell extends Cell {
    heading: string;
}


export class TextCell extends Cell {
    text: string; // With some markdown here.
}


export class CodeCell extends Cell {
    code: string;
    language: string;
}


export class ImageCell extends Cell {
    imgUri: string;
    description: string;
}


export class LinkCell extends Cell {
    linkUri: string;
    linkTitle: string;
    description: string;
}


export class ArticleContent {
    cells: (HeadingCell | TextCell | CodeCell | ImageCell)[];
}


export type PostContent = ArticleContent | LinkSetContent | ImageSetContent;


export class LinkSetContent {
    openingParagraph: string;
    cells: LinkCell[];
}


export class ImageSetContent {
    openingParagraph: string;
    cells: ImageCell[];
}


export class Post {
    id: number;
    blogId: number;
    ownerId: number;
    slug: string;
    state: PostState;
    type: PostType;
    revisionNumber: number;
    title: string;
    content: PostContent;
    timeCreated: Date;
    timeLastUpdated: Date;
}


export enum CommentState {
    Unknown = 0,
    Created = 1,
    Approved = 2,
    Withdrawn = 3,
    Archived = 4
}


export class CommentContent {
    text: string;
}


export class Comment {
    id: number;
    postId: number;
    blogId: number;
    ownerId: number;
    commenterId: number | null;
    parrentCommentId: number;
    state: CommentState;
    content: CommentContent;
    timeCreated: Date;
    timeLastUpdated: Date;
}
