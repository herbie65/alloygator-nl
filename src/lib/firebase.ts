import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, setDoc } from 'firebase/firestore';

// Firebase configuratie
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'alloygator-nl.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'alloygator-nl',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'alloygator-nl.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '501404252412',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:501404252412:web:0dd2bd394f9a13117a3f79'
};

console.log('Firebase config loaded successfully');

// Initialize Firebase only if not already initialized
let app;
let db: any = null;

const initializeFirebase = () => {
  console.log('initializeFirebase called');
  try {
    const apps = getApps();
    console.log('Existing apps:', apps.length);
    if (apps.length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      app = apps[0];
      console.log('Firebase already initialized');
    }
    
    if (!db) {
      console.log('Creating new Firestore instance...');
      db = getFirestore(app);
      console.log('Firestore database initialized, db value:', db);
    } else {
      console.log('db already exists:', db);
    }
    
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback initialization
    console.log('Attempting fallback initialization...');
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firestore database initialized (fallback), db value:', db);
    return db;
  }
}

const getDb = () => {
  console.log('getDb called, db value:', db);
  if (!db) {
    console.log('db is null/undefined, initializing Firebase...');
    return initializeFirebase();
  }
  console.log('db exists, returning:', db);
  return db;
}

// Database service functies
export class FirebaseService {
  // Generic CRUD operations
  static async getDocument(collectionName: string, docId: string) {
    try {
      console.log('getDocument called for:', collectionName, docId);
      const database = getDb();
      console.log('database from getDb:', database);
      if (!database) {
        throw new Error('Database is undefined after getDb() call');
      }
      const docRef = doc(database, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  static async getDocuments(collectionName: string, conditions: any[] = []) {
    try {
      const database = getDb();
      let q: any = collection(database, collectionName);
      
      // Apply conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      const querySnapshot = await getDocs(q);
      const documents: any[] = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...(doc.data() as any) });
      });
      
      return documents;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  static async addDocument(collectionName: string, data: any) {
    try {
      const database = getDb();
      const docRef = await addDoc(collection(database, collectionName), {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  static async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      if (!docId || typeof docId !== 'string') {
        throw new Error(`Invalid document id for collection ${collectionName}`)
      }
      const database = getDb();
      const docRef = doc(database, collectionName, docId);
      const { id, ...updateData } = data; // Remove id from data to avoid conflicts
      await setDoc(docRef, {
        ...updateData,
        updated_at: new Date().toISOString()
      }, { merge: true }); // Use setDoc with merge instead of updateDoc
      return { id: docId, ...updateData };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(collectionName: string, docId: string) {
    try {
      const database = getDb();
      const docRef = doc(database, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Specific operations for customers
  static async getCustomers() {
    return this.getDocuments('customers');
  }

  static async getCustomerById(id: string) {
    return this.getDocument('customers', id);
  }

  static async addCustomer(customerData: any) {
    return this.addDocument('customers', customerData);
  }

  static async updateCustomer(id: string, customerData: any) {
    return this.updateDocument('customers', id, customerData);
  }

  static async deleteCustomer(id: string) {
    return this.deleteDocument('customers', id);
  }

  // Specific operations for products
  static async getProducts() {
    return this.getDocuments('products');
  }

  static async getProductById(id: string) {
    return this.getDocument('products', id);
  }

  static async addProduct(productData: any) {
    return this.addDocument('products', productData);
  }

  static async updateProduct(id: string, productData: any) {
    return this.updateDocument('products', id, productData);
  }

  static async deleteProduct(id: string) {
    return this.deleteDocument('products', id);
  }

  // Specific operations for orders
  static async getOrders() {
    return this.getDocuments('orders');
  }

  static async getOrderById(id: string) {
    return this.getDocument('orders', id);
  }

  static async addOrder(orderData: any) {
    return this.addDocument('orders', orderData);
  }

  static async updateOrder(id: string, orderData: any) {
    return this.updateDocument('orders', id, orderData);
  }

  // Specific operations for VAT settings
  static async getVatSettings() {
    return this.getDocuments('vat_settings');
  }

  static async createVatSetting(vatData: any) {
    return this.addDocument('vat_settings', vatData);
  }

  static async updateVatSetting(id: string, vatData: any) {
    return this.updateDocument('vat_settings', id, vatData);
  }

  static async deleteVatSetting(id: string) {
    return this.deleteDocument('vat_settings', id);
  }

  // Specific operations for shipping methods
  static async getShippingMethods() {
    return this.getDocuments('shipping_methods');
  }

  static async createShippingMethod(shippingData: any) {
    return this.addDocument('shipping_methods', shippingData);
  }

  static async updateShippingMethod(id: string, shippingData: any) {
    return this.updateDocument('shipping_methods', id, shippingData);
  }

  static async deleteShippingMethod(id: string) {
    return this.deleteDocument('shipping_methods', id);
  }

  // Specific operations for payment methods
  static async getPaymentMethods() {
    return this.getDocuments('payment_methods');
  }

  static async createPaymentMethod(paymentData: any) {
    return this.addDocument('payment_methods', paymentData);
  }

  static async updatePaymentMethod(id: string, paymentData: any) {
    return this.updateDocument('payment_methods', id, paymentData);
  }

  static async deletePaymentMethod(id: string) {
    return this.deleteDocument('payment_methods', id);
  }

  // Suppliers (leveranciers)
  static async getSuppliers() {
    try {
      // Try common collection names in order
      const candidates = ['suppliers', 'leveranciers', 'vendor', 'vendors']
      for (const name of candidates) {
        try {
          const docs = await this.getDocuments(name)
          if (Array.isArray(docs) && docs.length > 0) return docs
        } catch (_) {
          // ignore and try next
        }
      }
      return []
    } catch {
      return []
    }
  }

  // Specific operations for customer groups
  static async getCustomerGroups() {
    return this.getDocuments('customer_groups');
  }

  static async createCustomerGroup(groupData: any) {
    return this.addDocument('customer_groups', groupData);
  }

  static async updateCustomerGroup(id: string, groupData: any) {
    return this.updateDocument('customer_groups', id, groupData);
  }

  static async deleteCustomerGroup(id: string) {
    return this.deleteDocument('customer_groups', id);
  }

  // Specific operations for CMS pages
  static async getCMSPages() {
    return this.getDocuments('cms_pages');
  }

  static async createCMSPage(pageData: any) {
    return this.addDocument('cms_pages', pageData);
  }

  static async updateCMSPage(id: string, pageData: any) {
    return this.updateDocument('cms_pages', id, pageData);
  }

  static async deleteCMSPage(id: string) {
    return this.deleteDocument('cms_pages', id);
  }

  // Specific operations for CRM contact moments
  static async getContactMoments(customerId?: string) {
    if (customerId) {
      return this.getDocuments('contact_moments', [{ field: 'customer_id', operator: '==', value: customerId }]);
    }
    return this.getDocuments('contact_moments');
  }

  static async createContactMoment(contactData: any) {
    return this.addDocument('contact_moments', contactData);
  }

  static async updateContactMoment(id: string, contactData: any) {
    return this.updateDocument('contact_moments', id, contactData);
  }

  static async deleteContactMoment(id: string) {
    return this.deleteDocument('contact_moments', id);
  }

  // Specific operations for CRM visits
  static async getVisits(customerId?: string) {
    if (customerId) {
      return this.getDocuments('visits', [{ field: 'customer_id', operator: '==', value: customerId }]);
    }
    return this.getDocuments('visits');
  }

  static async createVisit(visitData: any) {
    return this.addDocument('visits', visitData);
  }

  static async updateVisit(id: string, visitData: any) {
    return this.updateDocument('visits', id, visitData);
  }

  static async deleteVisit(id: string) {
    return this.deleteDocument('visits', id);
  }

  // Specific operations for dealers
  static async getDealers() {
    return this.getDocuments('dealers');
  }

  static async createDealer(dealerData: any) {
    return this.addDocument('dealers', dealerData);
  }

  static async updateDealer(id: string, dealerData: any) {
    return this.updateDocument('dealers', id, dealerData);
  }

  static async deleteDealer(id: string) {
    return this.deleteDocument('dealers', id);
  }

  // Specific operations for header settings
  static async getHeaderSettings() {
    return this.getDocuments('header_settings');
  }

  static async updateHeaderSettings(id: string, headerData: any) {
    return this.updateDocument('header_settings', id, headerData);
  }

  // Header/Footer (HTML blocks)
  static async getHeaderFooter() {
    return this.getDocuments('header_footer')
  }

  static async updateHeaderFooter(id: string, data: any) {
    return this.updateDocument('header_footer', id, data)
  }

  static async createHeaderFooter(data: any) {
    return this.addDocument('header_footer', data)
  }

  // Specific operations for DHL settings
  static async getDhlSettings() {
    return this.getDocuments('dhl_settings');
  }

  static async updateDhlSettings(id: string, dhlData: any) {
    return this.updateDocument('dhl_settings', id, dhlData);
  }

  // Specific operations for shipping settings
  static async getShippingSettings() {
    return this.getDocuments('shipping_settings');
  }

  static async updateShippingSettings(id: string, shippingData: any) {
    return this.updateDocument('shipping_settings', id, shippingData);
  }

  // Specific operations for payment settings
  static async getPaymentSettings() {
    return this.getDocuments('payment_settings');
  }

  static async updatePaymentSettings(id: string, paymentData: any) {
    return await this.updateDocument('payment_settings', id, paymentData);
  }

  // Categories
  static async getCategories() {
    return await this.getDocuments('categories', []);
  }

  static async getCategoryById(id: string) {
    return await this.getDocument('categories', id);
  }

  static async createCategory(categoryData: any) {
    return await this.addDocument('categories', categoryData);
  }

  static async updateCategory(id: string, categoryData: any) {
    return await this.updateDocument('categories', id, categoryData);
  }

  static async deleteCategory(id: string) {
    return await this.deleteDocument('categories', id);
  }

  // Product Attributes
  static async getProductAttributes() {
    return await this.getDocuments('product_attributes', []);
  }

  static async createProductAttribute(attributeData: any) {
    return await this.addDocument('product_attributes', attributeData);
  }

  static async updateProductAttribute(id: string, attributeData: any) {
    return await this.updateDocument('product_attributes', id, attributeData);
  }

  static async deleteProductAttribute(id: string) {
    return await this.deleteDocument('product_attributes', id);
  }

  // Product Colors
  static async getProductColors() {
    return await this.getDocuments('product_colors', []);
  }

  static async createProductColor(colorData: any) {
    return await this.addDocument('product_colors', colorData);
  }

  static async updateProductColor(id: string, colorData: any) {
    return await this.updateDocument('product_colors', id, colorData);
  }

  static async deleteProductColor(id: string) {
    return await this.deleteDocument('product_colors', id);
  }

  // Settings
  static async getSettings() {
    return await this.getDocuments('settings', []);
  }

  static async updateSettings(id: string, settingsData: any) {
    return await this.updateDocument('settings', id, settingsData);
  }
}

export { db, app };