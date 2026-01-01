import { getServiceUrl } from "./appConfig";

export interface Post {
  id: number;
  userId: number;
  username: string;
  title: string;
  content: string;
  createdAt: string;
}

const API_URL = getServiceUrl("social-feed-service");

export const feedApi = {
  // Get posts from followed users
  async getFollowedPosts(userId: number): Promise<Post[]> {
    try {
      const response = await fetch(`${API_URL}/feed/followingPosts/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch followed posts: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching followed posts:", error);
      throw error;
    }
  },

  // Get user's own posts
  async getUserPosts(userId: number): Promise<Post[]> {
    try {
      const response = await fetch(`${API_URL}/post/user/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user posts: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error;
    }
  },

  // Create a new post
  async createPost(post: Omit<Post, "id" | "createdAt">): Promise<Post> {
    try {
      const response = await fetch(`${API_URL}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          createdAt: new Date().toISOString(),
          automated: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // Delete a post
  async deletePost(postId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/post/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
};