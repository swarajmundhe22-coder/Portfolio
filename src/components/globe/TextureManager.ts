/**
 * Texture Management System
 * Handles loading, caching, and lifecycle of 3D textures
 */

import * as THREE from 'three';
import type { TextureConfig } from './types';

interface CachedTexture {
  texture: THREE.Texture;
  url: string;
  loadedAt: number;
  refCount: number;
}

export class TextureManager {
  private textureCache: Map<string, CachedTexture> = new Map();
  private loader: THREE.TextureLoader;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;

  constructor() {
    this.loader = new THREE.TextureLoader();
  }

  /**
   * Load texture with caching and error handling
   */
  public async loadTexture(url: string): Promise<THREE.Texture> {
    // Check cache
    if (this.textureCache.has(url)) {
      const cached = this.textureCache.get(url)!;
      cached.refCount++;
      return cached.texture;
    }

    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        this.loader.load(
          url,
          resolve,
          undefined,
          reject
        );
      });

      // Configure texture for optimal rendering
      texture.encoding = THREE.sRGBEncoding;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.anisotropy = 4;

      // Store in cache
      const estimatedSize = this.estimateTextureSize(texture);
      this.ensureCacheSpace(estimatedSize);

      this.textureCache.set(url, {
        texture,
        url,
        loadedAt: Date.now(),
        refCount: 1
      });

      this.currentCacheSize += estimatedSize;
      return texture;
    } catch (error) {
      console.error(`Failed to load texture: ${url}`, error);
      throw new Error(`Texture load failed: ${url}`);
    }
  }

  /**
   * Load all textures for globe rendering
   */
  public async loadGlobeTextures(config: Partial<TextureConfig>): Promise<{
    earthTexture: THREE.Texture;
    bumpMap?: THREE.Texture;
    specularMap?: THREE.Texture;
    cloudMap?: THREE.Texture;
  }> {
    const defaultUrls = {
      earthTexture: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      bumpMap: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    };

    const urls = { ...defaultUrls, ...config };

    try {
      const earthTexture = await this.loadTexture(urls.earthTexture);
      const bumpMap = urls.bumpMap ? await this.loadTexture(urls.bumpMap) : undefined;
      const specularMap = urls.specularMap ? await this.loadTexture(urls.specularMap) : undefined;
      const cloudMap = urls.cloudMap ? await this.loadTexture(urls.cloudMap) : undefined;

      return { earthTexture, bumpMap, specularMap, cloudMap };
    } catch (error) {
      console.error('Failed to load globe textures', error);
      throw error;
    }
  }

  /**
   * Release texture and free cache
   */
  public releaseTexture(url: string): void {
    const cached = this.textureCache.get(url);
    if (cached) {
      cached.refCount--;
      if (cached.refCount <= 0) {
        cached.texture.dispose();
        this.textureCache.delete(url);
        this.currentCacheSize -= this.estimateTextureSize(cached.texture);
      }
    }
  }

  /**
   * Clear all textures
   */
  public clearCache(): void {
    this.textureCache.forEach(cached => {
      cached.texture.dispose();
    });
    this.textureCache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; count: number; maxSize: number } {
    return {
      size: this.currentCacheSize,
      count: this.textureCache.size,
      maxSize: this.maxCacheSize
    };
  }

  private ensureCacheSpace(requiredSize: number): void {
    while (this.currentCacheSize + requiredSize > this.maxCacheSize && this.textureCache.size > 0) {
      // Remove least recently used texture
      let lruUrl = '';
      let lruTime = Date.now();

      this.textureCache.forEach((cached, url) => {
        if (cached.refCount === 0 && cached.loadedAt < lruTime) {
          lruUrl = url;
          lruTime = cached.loadedAt;
        }
      });

      if (lruUrl) {
        this.releaseTexture(lruUrl);
      } else {
        break;
      }
    }
  }

  private estimateTextureSize(texture: THREE.Texture): number {
    if (!texture.image) return 0;
    const { width = 0, height = 0 } = texture.image;
    return width * height * 4; // Assume RGBA
  }

  public dispose(): void {
    this.clearCache();
  }
}
