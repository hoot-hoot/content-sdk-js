import { SessionToken } from '@truesparrow/identity-sdk-js/session-token'

import {
    Blog,
    Comment,
    Post,
    PostType,
} from './entities'


export interface PrivateContentClient {
    withContext(sessionToken: SessionToken): PrivateContentClient;

    getBlog(): Promise<Blog>;
    createBlog(name: string, subdomain: string): Promise<Blog>;
    activateBlog(): Promise<Blog>;
    archiveBlog(): Promise<void>;

    getPost(postId: number): Promise<Post>;
    createPost(postType: PostType): Promise<Post>;
    updatePostTitle(newTitle: string): Promise<Post>;
    updatePostContent(baseRevisionNumber: number, contentDiff: any): Promise<Post>;
    publishPost(post: Post): Promise<Post>;
    unpublishPost(post: Post): Promise<Post>;
    archivePost(post: Post): Promise<Post>;

    approveComment(post: Post, comment: Comment): Promise<Comment>;
    archiveComment(post: Post, comment: Comment): Promise<Comment>;
}
