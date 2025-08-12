import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { app } from './firebase'

const storage = getStorage(app)

export class FirebaseStorageService {
  // Upload file to Firebase Storage
  static async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      console.log(`✅ File uploaded successfully: ${path}`)
      return downloadURL
    } catch (error) {
      console.error('❌ Error uploading file:', error)
      throw error
    }
  }

  // Delete file from Firebase Storage
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
      console.log(`✅ File deleted successfully: ${path}`)
    } catch (error) {
      console.error('❌ Error deleting file:', error)
      throw error
    }
  }

  // Generate unique path for document
  static generateDocumentPath(fileName: string, category: string): string {
    const timestamp = Date.now()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `documents/${category}/${timestamp}_${sanitizedName}`
  }

  // Generate unique path for customer upload
  static generateCustomerUploadPath(fileName: string, customerId: string): string {
    const timestamp = Date.now()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `customer_uploads/${customerId}/${timestamp}_${sanitizedName}`
  }

  // Get file size in human readable format
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Validate file type
  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    
    return allowedTypes.includes(file.type)
  }

  // Validate file size (max 10MB)
  static isValidFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024 // 10MB
    return file.size <= maxSize
  }
}
