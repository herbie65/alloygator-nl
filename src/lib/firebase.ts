import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, setDoc, DocumentReference } from 'firebase/firestore';

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

// Ensure Firebase is initialized on module load in the browser so hooks using `db` work immediately
try {
  if (typeof window !== 'undefined') {
    initializeFirebase();
  }
} catch (_) {
  // ignore init errors here; callers using getDb() will retry
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

// BTW (VAT) nummers voor e-Boekhouden
export const BTW_NUMMERS = {
  HOOG_VERK_21: 'HOOG_VERK_21',    // 21% BTW verkoop
  LAAG_VERK_9: 'LAAG_VERK_9',      // 9% BTW verkoop
  BI_EU_VERK: 'BI_EU_VERK',        // BTW-vrije verkoop binnen EU
  GEEN: 'GEEN'                      // Geen BTW
}

// Database service functies
export class FirebaseService {
  // Helper functie om logische ID's te genereren
  static async generateLogicalId(collectionName: string, data: any): Promise<string> {
    const timestamp = Date.now()
    const date = new Date(timestamp)
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '')
    
    switch (collectionName) {
      case 'products': return await this.generateNumericProductId()
      case 'orders': return `ORD-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'product_colors': return this.generateColorId(data)
      case 'categories': return `CAT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'suppliers': return `SUP-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'customers': return await this.generateNumericCustomerId()
      case 'users': return `USER-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'cms_pages': return `CMS-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'documents': return `DOC-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'invoices': return `INV-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'shipping_methods': return `SHIP-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'payment_methods': return `PAY-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'vat_settings': return `VAT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'settings': return `SETT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'customer_groups': return `CGRP-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'returns': return `RET-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      default: return `${collectionName.toUpperCase().slice(0, 4)}-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
    }
  }

  // Helper for generating numeric product IDs
  private static async generateNumericProductId(): Promise<string> {
    try {
      const products = await this.getDocuments('products')
      let maxId = 0

      if (Array.isArray(products)) {
        for (const p of products) {
          const idStr = String(p.id || '')
          if (/^\d+$/.test(idStr)) {
            const n = parseInt(idStr, 10)
            if (n > maxId) maxId = n
          }
        }
      }

      const next = maxId + 1
      return String(next)
    } catch (error) {
      console.error('Error generating numeric product ID:', error)
      // Fallback to time-based suffix if listing products failed
      const ts = Date.now()
      return String(100000 + (ts % 100000))
    }
  }

  // Helper functie om kleur ID's te genereren op basis van medeklinkers
  static generateColorId(colorData: any): string {
    if (!colorData || !colorData.name) {
      // Fallback naar timestamp als er geen naam is
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
      const timestamp = Date.now()
      return `kleur-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
    }

    // Haal medeklinkers uit de kleurnaam
    const consonants = colorData.name.toLowerCase()
      .replace(/[aeiou]/g, '') // Verwijder alle klinkers
      .replace(/[^a-z]/g, '') // Verwijder alle niet-alfabetische karakters
      .substring(0, 8) // Maximaal 8 medeklinkers

    // Als er geen medeklinkers zijn, gebruik de eerste letters
    if (!consonants) {
      const firstLetters = colorData.name.toLowerCase()
        .replace(/[^a-z]/g, '')
        .substring(0, 4)
      return `kleur-${firstLetters}`
    }

    return `kleur-${consonants}`
  }

  // Generic CRUD operations
  static async getDocument(collectionName: string, docId: string) {
    try {
      console.log('getDocument called for:', collectionName, docId);
      const database = getDb();
      console.log('database from getDb:', database);
      if (!database) {
        throw new Error('Database is undefined after getDb() call');
      }
      
      // Gebruik de geïmporteerde doc functie expliciet
      const docRef: DocumentReference = doc(database, collectionName, docId);
      console.log('docRef created:', docRef);
      
      const docSnap = await getDoc(docRef);
      console.log('docSnap retrieved:', docSnap.exists());
      
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
      const logicalId = await this.generateLogicalId(collectionName, data)
      const docRef = doc(database, collectionName, logicalId)
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: logicalId, ...data };
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('customers', customerData)
      const docRef = doc(database, 'customers', logicalId);
      
      await setDoc(docRef, {
        ...customerData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...customerData };
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  // Migrate existing customers to numeric IDs
  static async migrateCustomersToNumericIds() {
    try {
      const customers = await this.getDocuments('customers');
      if (!customers || customers.length === 0) return;
      
      let nextNumber = 2000;
      const migratedCustomers = [];
      
      for (const customer of customers) {
        // Check if customer already has numeric ID
        if (String(customer.id).match(/^#?(\d+)$/)) {
          const num = parseInt(String(customer.id).replace('#', ''));
          if (num >= 2000) {
            nextNumber = Math.max(nextNumber, num + 1);
          }
        }
      }
      
      for (const customer of customers) {
        // Skip if already has numeric ID
        if (String(customer.id).match(/^#?(\d+)$/)) {
          const num = parseInt(String(customer.id).replace('#', ''));
          if (num >= 2000) continue;
        }
        
        // Create new numeric ID
        const newId = `#${nextNumber}`;
        const database = getDb();
        
        // Create new document with numeric ID
        const newDocRef = doc(database, 'customers', newId);
        await setDoc(newDocRef, {
          ...customer,
          id: newId,
          updated_at: new Date().toISOString()
        });
        
        // Delete old document
        const oldDocRef = doc(database, 'customers', customer.id);
        await deleteDoc(oldDocRef);
        
        migratedCustomers.push({ oldId: customer.id, newId });
        nextNumber++;
      }
      
      console.log(`✅ Migrated ${migratedCustomers.length} customers to numeric IDs:`, migratedCustomers);
      return migratedCustomers;
    } catch (error) {
      console.error('Error migrating customers:', error);
      throw error;
    }
  }

  static async updateCustomer(id: string, customerData: any) {
    return this.updateDocument('customers', id, customerData);
  }

  static async deleteCustomer(id: string) {
    return this.deleteDocument('customers', id);
  }

  // Helper for generating numeric customer IDs
  private static async generateNumericCustomerId(): Promise<string> {
    try {
      const existingCustomers = await this.getDocuments('customers');
      let maxNumericId = 1999; // Start from 2000, so 1999 is the last one

      if (existingCustomers && Array.isArray(existingCustomers)) {
        for (const customer of existingCustomers) {
          if (String(customer.id).match(/^#?(\d+)$/)) {
            const num = parseInt(String(customer.id).replace('#', ''));
            if (num > maxNumericId) {
              maxNumericId = num;
            }
          }
        }
      }

      const nextNumericId = maxNumericId + 1;
      return `#${nextNumericId}`;
    } catch (error) {
      console.error('Error generating numeric customer ID:', error);
      // Fallback to timestamp-based ID if there's an error
      const timestamp = Date.now();
      return `#${2000 + (timestamp % 1000)}`;
    }
  }

  // Specific operations for products
  static async getProducts() {
    return this.getDocuments('products');
  }

  static async getProductById(id: string) {
    return this.getDocument('products', id);
  }

  static async addProduct(productData: any) {
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('products', productData)
      
      const nowIso = new Date().toISOString();
      const { id: _omitId, created_at, updated_at, ...rest } = productData || {};

      const payload = {
        ...rest,
        id: logicalId,
        created_at: created_at || nowIso,
        updated_at: nowIso,
      };

      const docRef = doc(database, 'products', logicalId);
      await setDoc(docRef, payload, { merge: true });
      return { id: logicalId, ...payload };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('orders', orderData)
      const docRef = doc(database, 'orders', logicalId)
      
      await setDoc(docRef, {
        ...orderData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...orderData };
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  static async updateOrder(id: string, orderData: any) {
    return this.updateDocument('orders', id, orderData);
  }

  // Specific operations for VAT settings
  static async getVatSettings() {
    return this.getDocuments('vat_settings');
  }

  static async createVatSetting(vatData: any) {
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('vat_settings', vatData)
      const docRef = doc(database, 'vat_settings', logicalId)
      
      await setDoc(docRef, {
        ...vatData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...vatData };
    } catch (error) {
      console.error('Error creating VAT setting:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('shipping_methods', shippingData)
      const docRef = doc(database, 'shipping_methods', logicalId)
      
      await setDoc(docRef, {
        ...shippingData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...shippingData };
    } catch (error) {
      console.error('Error creating shipping method:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('payment_methods', paymentData)
      const docRef = doc(database, 'payment_methods', logicalId)
      
      await setDoc(docRef, {
        ...paymentData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...paymentData };
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('customer_groups', groupData)
      const docRef = doc(database, 'customer_groups', logicalId)
      
      await setDoc(docRef, {
        ...groupData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...groupData };
    } catch (error) {
      console.error('Error creating customer group:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('cms_pages', pageData)
      const docRef = doc(database, 'cms_pages', logicalId)
      
      await setDoc(docRef, {
        ...pageData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...pageData };
    } catch (error) {
      console.error('Error creating CMS page:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('contact_moments', contactData)
      const docRef = doc(database, 'contact_moments', logicalId)
      
      await setDoc(docRef, {
        ...contactData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...contactData };
    } catch (error) {
      console.error('Error creating contact moment:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('visits', visitData)
      const docRef = doc(database, 'visits', logicalId)
      
      await setDoc(docRef, {
        ...visitData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...visitData };
    } catch (error) {
      console.error('Error creating visit:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('dealers', dealerData)
      const docRef = doc(database, 'dealers', logicalId)
      
      await setDoc(docRef, {
        ...dealerData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...dealerData };
    } catch (error) {
      console.error('Error creating dealer:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('header_footer', data)
      const docRef = doc(database, 'header_footer', logicalId)
      
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...data };
    } catch (error) {
      console.error('Error creating header/footer:', error);
      throw error;
    }
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
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('categories', categoryData)
      const docRef = doc(database, 'categories', logicalId)
      
      await setDoc(docRef, {
        ...categoryData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...categoryData };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, categoryData: any) {
    return await this.updateDocument('categories', id, categoryData);
  }

  static async deleteCategory(id: string) {
    return await this.deleteDocument('categories', id);
  }





  // Product Colors - DEPRECATED: Use product_attributes instead
  // static async getProductColors(): Promise<any[]> {
  //   const q = query(
  //     collection(db, 'product_colors'),
  //     where('is_active', '==', true),
  //     orderBy('sort_order', 'asc')
  //   )
  //   const snapshot = await getDocs(q)
  //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  // }

  static async createProductColor(colorData: any) {
    try {
      const database = getDb();
      const logicalId = await this.generateLogicalId('product_colors', colorData)
      const docRef = doc(database, 'product_colors', logicalId)
      
      await setDoc(docRef, {
        ...colorData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: logicalId, ...colorData };
    } catch (error) {
      console.error('Error creating product color:', error);
      throw error;
    }
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