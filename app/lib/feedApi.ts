import { getServiceUrl } from "./appConfig";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export interface Post {
  id: number;
  userId: number;
  username: string;
  title: string;
  content: string;
  createdAt: string;
  postimageurl: string;
}

const API_URL = getServiceUrl("/api/feed");
const IMAGE_FUNCTION_URL = "https://imageresizetest2-b0dbbshhgzdnfgbv.germanywestcentral-01.azurewebsites.net/api/ResizeAndUploadImage";

export const feedApi = {
  // Upload image to Azure Function
  async uploadImage(imageUri: string): Promise<string> {
    try {
      let blob: Blob;

      // Handle web vs native platforms differently
      if (Platform.OS === "web") {
        // On web, fetch the file directly from the URI
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        // On native platforms, use FileSystem to read as base64
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to binary
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

      // DON'T set Content-Type header - let fetch handle it
      const uploadResponse = await fetch(IMAGE_FUNCTION_URL, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorMessage = `Image upload failed: ${uploadResponse.status}`;
        try {
          const error = await uploadResponse.json();
          errorMessage += ` - ${error.error}`;
        } catch {
          errorMessage += ` - ${uploadResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await uploadResponse.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

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
      const response = await fetch(`${API_URL}/feed/post/user/${userId}`);
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
      const response = await fetch(`${API_URL}/feed/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          createdAt: new Date().toISOString().slice(0, 19),
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
      const response = await fetch(`${API_URL}/feed/post/${postId}`, {
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

  // Get my posts
  async getMyPosts(userId: number): Promise<Post[]> {
    try {
      const response = await fetch(`${API_URL}/feed/postFrom/${userId}`);
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