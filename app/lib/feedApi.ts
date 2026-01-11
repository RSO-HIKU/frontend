import { getServiceUrl, getImageUploadFunctionUrl } from "./appConfig";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { authFetch } from "./authFetch";

export interface Post {
  id: number;
  userId: string;
  username: string;
  title: string;
  content: string;
  createdAt: string;
  postimageurl: string;
}

const API_URL = getServiceUrl("/api/feed");
const IMAGE_FUNCTION_URL = getImageUploadFunctionUrl();

export const feedApi = {
  // Upload image to Azure Function
  async uploadImage(imageUri: string): Promise<string> {
    try {
      let blob: Blob;

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: "image/jpeg" });
      }
      
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");

      console.log(`[uploadImage] Sending to: ${IMAGE_FUNCTION_URL}`);
      
      const uploadResponse = await fetch(IMAGE_FUNCTION_URL, {
        method: "POST",
        body: formData,
      });

      console.log(`[uploadImage] Status: ${uploadResponse.status}`);
      console.log(`[uploadImage] Status Text: ${uploadResponse.statusText}`);
      
      // Log all response headers
      const corsOrigin = uploadResponse.headers.get("Access-Control-Allow-Origin");
      const corsMethods = uploadResponse.headers.get("Access-Control-Allow-Methods");
      console.log(`[uploadImage] CORS Origin: ${corsOrigin}`);
      console.log(`[uploadImage] CORS Methods: ${corsMethods}`);
      console.log(`[uploadImage] All Headers:`, Array.from(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error(`[uploadImage] Error response: ${errorData}`);
        throw new Error(`Image upload failed: ${uploadResponse.status} - ${errorData}`);
      }

      const data = await uploadResponse.json();
      console.log(`[uploadImage] Success! URL: ${data.url}`);
      return data.url;
    } catch (error) {
      console.error("[uploadImage] Exception:", error);
      throw error;
    }
  },

  // Get posts from followed users
  async getFollowedPosts(userId: string, getToken?: () => Promise<string | null>): Promise<Post[]> {
    try {
      const response = await authFetch(`${API_URL}/feed/followingPosts/${userId}`, { method: "GET" }, getToken);
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
  async getUserPosts(userId: string, getToken?: () => Promise<string | null>): Promise<Post[]> {
    try {
      const response = await authFetch(`${API_URL}/feed/post/user/${userId}`, { method: "GET" }, getToken);
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
  async createPost(post: Omit<Post, "id" | "createdAt">, getToken?: () => Promise<string | null>): Promise<Post> {

    console.log("Creating post with data: ", post);
    try {
      const response = await authFetch(`${API_URL}/feed/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          createdAt: new Date().toISOString().slice(0, 19),
          automated: false,
          postimageurl: post.postimageurl,
        }),
      }, getToken);
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
  async deletePost(postId: number, getToken?: () => Promise<string | null>): Promise<void> {
    try {
      const response = await authFetch(`${API_URL}/feed/post/${postId}`, {
        method: "DELETE",
      }, getToken);
      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },

  // Get my posts
  async getMyPosts(userId: string, getToken?: () => Promise<string | null>): Promise<Post[]> {
    try {
      const response = await authFetch(`${API_URL}/feed/postFrom/${userId}`, { method: "GET" }, getToken);
      if (!response.ok) {
        throw new Error(`Failed to fetch my posts: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching my posts:", error);
      throw error;
    }
  },
};