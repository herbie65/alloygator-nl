import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Firebase configuratie
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if not already initialized
let app;
try {
  const apps = getApps();
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback initialization
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

// Database service functies
export class FirebaseService {
  // Generic CRUD operations
  static async getDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
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
      let q: any = collection(db, collectionName);
      
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
      const docRef = await addDoc(collection(db, collectionName), {
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
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date()
      });
      return { id: docId, ...data };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
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
    return this.updateDocument('payment_settings', id, paymentData);
  }
}

export { db }; 