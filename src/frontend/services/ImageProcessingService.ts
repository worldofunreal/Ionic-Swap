export interface ImageProcessingOptions {
  width: number
  height: number
  quality: number
  format: 'webp' | 'jpeg' | 'png'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface ProcessedImage {
  blob: Blob
  url: string
  size: number
  width: number
  height: number
  format: string
}

export class ImageProcessingService {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  /**
   * Process image for avatar (384x384, WebP, 75% quality)
   */
  async processAvatar(file: File): Promise<ProcessedImage> {
    return this.processImage(file, {
      width: 384,
      height: 384,
      quality: 0.75,
      format: 'webp',
      fit: 'cover',
    })
  }

  /**
   * Process image for banner (1500x500, WebP, 75% quality)
   */
  async processBanner(file: File): Promise<ProcessedImage> {
    return this.processImage(file, {
      width: 1500,
      height: 500,
      quality: 0.75,
      format: 'webp',
      fit: 'cover',
    })
  }

  /**
   * Generic image processing with custom options
   */
  async processImage(
    file: File,
    options: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      // Create image element
      const img = new Image()
      img.onload = () => {
        try {
          // Set canvas dimensions
          this.canvas.width = options.width
          this.canvas.height = options.height

          // Clear canvas
          this.ctx.clearRect(0, 0, options.width, options.height)

          // Calculate dimensions based on fit mode
          const { drawWidth, drawHeight, offsetX, offsetY } =
            this.calculateDimensions(
              img.width,
              img.height,
              options.width,
              options.height,
              options.fit || 'cover'
            )

          // Draw image with proper scaling and positioning
          this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

          // Convert to blob with specified format and quality
          this.canvas.toBlob(
            blob => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                resolve({
                  blob,
                  url,
                  size: blob.size,
                  width: options.width,
                  height: options.height,
                  format: options.format,
                })
              } else {
                reject(new Error('Failed to create blob'))
              }
            },
            `image/${options.format}`,
            options.quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      // Load image from file
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Calculate drawing dimensions based on fit mode
   */
  private calculateDimensions(
    imgWidth: number,
    imgHeight: number,
    targetWidth: number,
    targetHeight: number,
    fit: string
  ): {
    drawWidth: number
    drawHeight: number
    offsetX: number
    offsetY: number
  } {
    const imgAspect = imgWidth / imgHeight
    const targetAspect = targetWidth / targetHeight

    let drawWidth: number
    let drawHeight: number
    let offsetX: number
    let offsetY: number

    switch (fit) {
      case 'cover':
        // Fill entire canvas, cropping if necessary
        if (imgAspect > targetAspect) {
          drawHeight = targetHeight
          drawWidth = targetHeight * imgAspect
          offsetX = (targetWidth - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = targetWidth
          drawHeight = targetWidth / imgAspect
          offsetX = 0
          offsetY = (targetHeight - drawHeight) / 2
        }
        break

      case 'contain':
        // Fit entire image within canvas
        if (imgAspect > targetAspect) {
          drawWidth = targetWidth
          drawHeight = targetWidth / imgAspect
          offsetX = 0
          offsetY = (targetHeight - drawHeight) / 2
        } else {
          drawHeight = targetHeight
          drawWidth = targetHeight * imgAspect
          offsetX = (targetWidth - drawWidth) / 2
          offsetY = 0
        }
        break

      case 'fill':
        // Stretch to fill entire canvas
        drawWidth = targetWidth
        drawHeight = targetHeight
        offsetX = 0
        offsetY = 0
        break

      case 'inside':
        // Fit inside canvas, maintaining aspect ratio
        if (imgAspect > targetAspect) {
          drawWidth = targetWidth
          drawHeight = targetWidth / imgAspect
        } else {
          drawHeight = targetHeight
          drawWidth = targetHeight * imgAspect
        }
        offsetX = (targetWidth - drawWidth) / 2
        offsetY = (targetHeight - drawHeight) / 2
        break

      case 'outside':
        // Fill outside canvas, maintaining aspect ratio
        if (imgAspect > targetAspect) {
          drawHeight = targetHeight
          drawWidth = targetHeight * imgAspect
          offsetX = (targetWidth - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = targetWidth
          drawHeight = targetWidth / imgAspect
          offsetX = 0
          offsetY = (targetHeight - drawHeight) / 2
        }
        break

      default:
        // Default to cover
        if (imgAspect > targetAspect) {
          drawHeight = targetHeight
          drawWidth = targetHeight * imgAspect
          offsetX = (targetWidth - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = targetWidth
          drawHeight = targetWidth / imgAspect
          offsetX = 0
          offsetY = (targetHeight - drawHeight) / 2
        }
    }

    return { drawWidth, drawHeight, offsetX, offsetY }
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Validate file type
   */
  isValidImageType(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]
    return validTypes.includes(file.type)
  }

  /**
   * Get image dimensions from file
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Clean up object URLs to prevent memory leaks
   */
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url)
  }
}

// Singleton instance
let imageProcessingService: ImageProcessingService | null = null

export function getImageProcessingService(): ImageProcessingService {
  if (!imageProcessingService) {
    imageProcessingService = new ImageProcessingService()
  }
  return imageProcessingService
}
