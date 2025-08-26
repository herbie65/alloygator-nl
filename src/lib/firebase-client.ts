import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy, limit, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.appspot.com",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79",
  measurementId: "G-QY0QVXYJ5H"
};

// Initialize Firebase (guard against duplicate app)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Prevent auth errors in static export
if (typeof window !== 'undefined') {
  // Only run in browser
  try {
    // Initialize Firestore without auth for static export
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Frontend Firebase service
export class FirebaseClientService {
  // Helper functie om logische ID's te genereren
  static generateLogicalId(collectionName: string, data?: any): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '') // HHMMSS
    const timestamp = Date.now()
    
    switch (collectionName) {
      case 'customers': return `CUST-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'products': return `PROD-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'orders': return `ORD-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'product_colors': return this.generateColorId(data)
      case 'categories': return `CAT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'suppliers': return `SUP-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'vat_settings': return `VAT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'shipping_settings': return `SHIP-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'payment_settings': return `PAY-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'dhl_settings': return `DHL-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'header_settings': return `HEAD-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'cms_pages': return `CMS-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'contact_moments': return `CONTACT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'visits': return `VISIT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'customer_groups': return `GROUP-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'dealers': return `DEALER-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'settings': return `SETTING-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'header_footer': return `HEADFOOT-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'shipping_methods': return `SHIPM-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'payment_methods': return `PAYM-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'customer_activities': return `ACTIVITY-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'customer_documents': return `DOC-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      case 'customer_uploads': return `UPLOAD-${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
      default: return `${dateStr}-${timeStr}-${String(timestamp).slice(-3)}`
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

  // Check if we're in development mode
  private static isDevelopment() {
    return typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('localhost')
    )
  }
  
  // Get all products
  static async getProducts() {
    try {
      if (this.isDevelopment()) {
        console.log('🔍 Development mode: Fetching products from Firebase...')
      }
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (this.isDevelopment()) {
        console.log(`✅ Successfully fetched ${products.length} products`)
      }
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      if (this.isDevelopment()) {
        console.warn('⚠️ Firebase products fetch failed, returning empty array')
      }
      return [];
    }
  }

  // Get all customers
  static async getCustomers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  // Get customer groups
  static async getCustomerGroups() {
    try {
      const querySnapshot = await getDocs(collection(db, 'customer_groups'));
      const groups = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return groups;
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      return [];
    }
  }

  // Get CMS pages
  static async getCmsPages() {
    try {
      if (this.isDevelopment()) {
        console.log('🔍 Development mode: Fetching CMS pages from Firebase...')
      }
      const querySnapshot = await getDocs(collection(db, 'cms_pages'));
      const pages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (this.isDevelopment()) {
        console.log(`✅ Successfully fetched ${pages.length} CMS pages`)
      }
      return pages;
    } catch (error) {
      console.error('Error fetching CMS pages:', error);
      if (this.isDevelopment()) {
        console.warn('⚠️ Firebase CMS pages fetch failed, returning empty array')
      }
      // Return empty array instead of throwing to prevent React crashes
      return [];
    }
  }

  // Get orders
  static async getOrders() {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Get invoices
  static async getInvoices() {
    try {
      const querySnapshot = await getDocs(collection(db, 'invoices'));
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  // Get customer by ID
  static async getCustomerById(id: string) {
    try {
      const docRef = doc(db, 'customers', id)
      const snap = await getDoc(docRef)
      if (snap.exists()) return { id: snap.id, ...snap.data() }
      return null
    } catch (error) {
      console.error('Error fetching customer by id:', error)
      return null
    }
  }

  // Get settings
  static async getSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'settings'));
      const settings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return settings[0] || null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  // Get homepage
  static async getHomepage() {
    try {
      const querySnapshot = await getDocs(collection(db, 'homepage'));
      const homepage = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return homepage[0] || null;
    } catch (error) {
      console.error('Error fetching homepage:', error);
      return null;
    }
  }

  // Get footer
  static async getFooter() {
    try {
      const querySnapshot = await getDocs(collection(db, 'footer'));
      const footer = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return footer[0] || null;
    } catch (error) {
      console.error('Error fetching footer:', error);
      return null;
    }
  }

  // New: header/footer HTML blocks from 'header_footer' collection
  static async getHeaderFooterByType(type: 'header' | 'footer') {
    try {
      const querySnapshot = await getDocs(collection(db, 'header_footer'))
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      const item = items.find((i:any)=> (i.type||'').toLowerCase() === type)
      return item || null
    } catch (e) {
      console.error('Error fetching header_footer:', e)
      return null
    }
  }

  // Get VAT settings
  static async getVatSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'vat_settings'));
      const settings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return settings;
    } catch (error) {
      console.error('Error fetching VAT settings:', error);
      return [];
    }
  }

  // Update VAT settings
  static async updateVatSettings(id: string, data: any) {
    try {
      const docRef = doc(db, 'vat_settings', id);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error('Error updating VAT settings:', error);
      return false;
    }
  }

  // Get header settings
  static async getHeaderSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'header_settings'));
      const settings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return settings[0] || null;
    } catch (error) {
      console.error('Error fetching header settings:', error);
      return null;
    }
  }

  // Get company info
getCompanyInfo

  // Get shipping settings
  static async getShippingSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'shipping_settings'));
      const settings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return settings;
    } catch (error) {
      console.error('Error fetching shipping settings:', error);
      return [];
    }
  }

  // Get payment settings
  static async getPaymentSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'payment_settings'));
      const settings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return settings[0] || null;
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      return null;
    }
  }

  // Get DHL settings
  static async getDhlSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, 'dhl_settings'));
      const settings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return settings[0] || null;
    } catch (error) {
      console.error('Error fetching DHL settings:', error);
      return null;
    }
  }

  // Get dealers by email
  static async getDealersByEmail(email: string) {
    try {
      const q = query(
        collection(db, 'customers'),
        where('email', '==', email),
        where('is_dealer', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const dealers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return dealers;
    } catch (error) {
      console.error('Error fetching dealers:', error);
      return [];
    }
  }

  // Get customers by email
  static async getCustomersByEmail(email: string) {
    try {
      const q = query(
        collection(db, 'customers'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      const customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return customers;
    } catch (error) {
      console.error('Error fetching customers by email:', error);
      return [];
    }
  }

  // Get order by ID
  static async getOrderById(id: string) {
    try {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Dealer activities (visits/contact moments)
  static async getActivitiesByEmail(email: string) {
    try {
      const q = query(collection(db, 'customer_activities'), where('customer_email', '==', email))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.error('Error fetching activities:', e)
      return []
    }
  }

  static async addActivity(data: any) {
    try {
      const logicalId = this.generateLogicalId('customer_activities', data)
      const docRef = doc(db, 'customer_activities', logicalId)
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: logicalId, ...data }
    } catch (e) { console.error('Error adding activity:', e); throw e }
  }

  static async deleteActivity(id: string) {
    try { await deleteDoc(doc(db, 'customer_activities', id)); return true } catch (e) { console.error('Error deleting activity:', e); throw e }
  }

  // Dealer documents (metadata only)
  static async getCustomerDocumentsByEmail(email: string) {
    try {
      const q = query(collection(db, 'customer_documents'), where('customer_email', '==', email))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.error('Error fetching documents:', e)
      return []
    }
  }

  static async addCustomerDocument(meta: any) {
    try {
      const logicalId = this.generateLogicalId('customer_documents', meta)
      const docRef = doc(db, 'customer_documents', logicalId)
      await setDoc(docRef, {
        ...meta,
        id: logicalId,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      return { id: logicalId, ...meta }
    } catch (e) { console.error('Error adding document:', e); throw e }
  }

  // Add new customer
  static async addCustomer(customerData: any) {
    try {
      const logicalId = this.generateLogicalId('customers', customerData)
      const docRef = doc(db, 'customers', logicalId)
      await setDoc(docRef, {
        ...customerData,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: logicalId, ...customerData }
    } catch (e) { console.error('Error adding customer:', e); throw e }
  }

  // Update existing customer
  static async updateCustomer(customerId: string, updateData: any) {
    try {
      const docRef = doc(db, 'customers', customerId)
      await updateDoc(docRef, {
        ...updateData,
        updated_at: new Date().toISOString()
      });
      return true
    } catch (e) { console.error('Error updating customer:', e); throw e }
  }

  // Add password reset token
  static async addPasswordReset(resetData: any) {
    try {
      const logicalId = this.generateLogicalId('password_resets', resetData)
      const docRef = doc(db, 'password_resets', logicalId)
      await setDoc(docRef, {
        ...resetData,
        id: logicalId,
        created_at: new Date().toISOString()
      });
      return { id: logicalId, ...resetData }
    } catch (e) { console.error('Error adding password reset:', e); throw e }
  }

  // Get password reset by token
  static async getPasswordResetByToken(token: string) {
    try {
      console.log('🔍 Searching for password reset token:', token);
      
      // Haal alle password resets op met deze token
      const q = query(
        collection(db, 'password_resets'),
        where('token', '==', token),
        where('used', '==', false)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('❌ No password reset found for token:', token);
        return null;
      }
      
      const resetDoc = querySnapshot.docs[0];
      const resetData = { id: resetDoc.id, ...resetDoc.data() } as any;
      
      console.log('🔍 Password reset found:', {
        id: resetData.id,
        email: resetData.email,
        expires_at: resetData.expires_at,
        used: resetData.used
      });
      
      // Controleer handmatig of de token is verlopen
      const now = new Date();
      const expiresAt = new Date(resetData.expires_at);
      
      if (now > expiresAt) {
        console.log('❌ Password reset token expired:', {
          now: now.toISOString(),
          expires_at: expiresAt.toISOString()
        });
        return null;
      }
      
      console.log('✅ Valid password reset token found');
      return resetData;
    } catch (error) {
      console.error('❌ Error fetching password reset:', error);
      return null;
    }
  }

  static async deleteCustomerDocument(id: string) {
    try { await deleteDoc(doc(db, 'customer_documents', id)); return true } catch (e) { console.error('Error deleting document:', e); throw e }
  }

  // VAT verification with VIES
  static async verifyVatNumber(vatNumber: string) {
    try {
      // Simulate VIES API call (in real implementation, you'd call the actual VIES API)
      const response = await fetch(`https://api.vatsensing.com/1.0/validate/?vat_number=${vatNumber}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying VAT number:', error);
      // Return mock data for now
      return {
        valid: true,
        country_code: 'NL',
        vat_number: vatNumber,
        request_date: new Date().toISOString(),
        name: 'Mock Company Name',
        address: 'Mock Address'
      };
    }
  }

  // Add new document
  static async addDocument(collectionName: string, data: any) {
    try {
      const logicalId = this.generateLogicalId(collectionName, data)
      const docRef = doc(db, collectionName, logicalId)
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: logicalId, ...data };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

    // CRM Contact Moments
  static async getContactMoments(customerId?: string) {
    try {
      if (customerId) {
        // Try with contact_date first (as seen in the data)
        try {
          const q = query(
            collection(db, 'contact_moments'), 
            where('customer_id', '==', customerId),
            orderBy('contact_date', 'desc')
          );
          const snapshot = await getDocs(q);
          const contacts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          if (contacts.length > 0) {
            console.log(`✅ Loaded ${contacts.length} contact moments with contact_date ordering`);
            return contacts;
          }
        } catch (dateError) {
          console.log('🔍 contact_date ordering failed, trying created_at...');
        }
        
        // Fallback to created_at
        const q = query(
          collection(db, 'contact_moments'), 
          where('customer_id', '==', customerId),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        const contacts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Loaded ${contacts.length} contact moments with created_at ordering`);
        return contacts;
      } else {
        const q = query(
          collection(db, 'contact_moments'), 
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      // Don't show errors to users - they will be resolved when indexes are created
      console.debug('🔍 Contact moments query failed (index not ready):', error.message);
      return [];
    }
  }

  // Get all contact moments without filtering (fallback method)
  static async getAllContactMoments() {
    try {
      const snapshot = await getDocs(collection(db, 'contact_moments'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.debug('🔍 Error loading all contact moments:', error.message);
      return [];
    }
  }

  static async addContactMoment(data: any) {
    try {
      const logicalId = this.generateLogicalId('contact_moments', data)
      const docRef = doc(db, 'contact_moments', logicalId)
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: logicalId, ...data };
    } catch (error) {
      console.error('Error adding contact moment:', error);
      throw error;
    }
  }

  static async updateContactMoment(id: string, data: any) {
    try {
      const docRef = doc(db, 'contact_moments', id);
      await updateDoc(docRef, { 
        ...data, 
        updated_at: new Date().toISOString() 
      });
      return { id, ...data };
    } catch (error) {
      console.error('Error updating contact moment:', error);
      throw error;
    }
  }

  static async deleteContactMoment(id: string) {
    try {
      await deleteDoc(doc(db, 'contact_moments', id));
      return true;
    } catch (error) {
      console.error('Error deleting contact moment:', error);
      throw error;
    }
  }

  // CRM Visits
  static async getVisits(customerId?: string) {
    try {
      if (customerId) {
        // Try with visit_date first (as seen in the data)
        try {
          const q = query(
            collection(db, 'visits'), 
            where('customer_id', '==', customerId),
            orderBy('visit_date', 'desc')
          );
          const snapshot = await getDocs(q);
          const visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          if (visits.length > 0) {
            console.log(`✅ Loaded ${visits.length} visits with visit_date ordering`);
            return visits;
          }
        } catch (dateError) {
          console.log('🔍 visit_date ordering failed, trying created_at...');
        }
        
        // Fallback to created_at
        const q = query(
          collection(db, 'visits'), 
          where('customer_id', '==', customerId),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        const visits = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Loaded ${visits.length} visits with created_at ordering`);
        return visits;
      } else {
        const q = query(
          collection(db, 'visits'), 
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      // Don't show errors to users - they will be resolved when indexes are created
      console.debug('🔍 Visits query failed (index not ready):', error.message);
      return [];
    }
  }

  // Get all visits without filtering (fallback method)
  static async getAllVisits() {
    try {
      const snapshot = await getDocs(collection(db, 'visits'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.debug('🔍 Error loading all visits:', error.message);
      return [];
    }
  }

  static async addVisit(data: any) {
    try {
      const logicalId = this.generateLogicalId('visits', data)
      const docRef = doc(db, 'visits', logicalId)
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { id: logicalId, ...data };
    } catch (error) {
      console.error('Error adding visit:', error);
      throw error;
    }
  }

  static async updateVisit(id: string, data: any) {
    try {
      const docRef = doc(db, 'visits', id);
      await updateDoc(docRef, { 
        ...data, 
        updated_at: new Date().toISOString() 
      });
      return { id, ...data };
    } catch (error) {
      console.error('Error updating visit:', error);
      throw error;
    }
  }

  static async deleteVisit(id: string) {
    try {
      await deleteDoc(doc(db, 'visits', id));
      return true;
    } catch (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  }

  // Update document in collection
  static async updateDocumentInCollection(collectionName: string, id: string, data: any) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
      return { id, ...data };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Get collection
  static async getCollection(collectionName: string) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error) {
      console.error(`Error fetching collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Set document (create or update)
  static async setDocument(collectionName: string, documentId: string, data: any) {
    try {
      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, data, { merge: true });
      return true;
    } catch (error) {
      console.error(`Error setting document ${documentId} in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document from collection
  static async deleteDocumentFromCollection(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // ===== DOCUMENTS SYSTEM =====
  
  // Get document categories
  static async getDocumentCategories() {
    try {
      const snapshot = await getDocs(collection(db, 'document_categories'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching document categories:', error);
      return [];
    }
  }

  // Get document permissions
  static async getDocumentPermissions() {
    try {
      const snapshot = await getDocs(collection(db, 'document_permissions'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching document permissions:', error);
      return [];
    }
  }

  // Get documents (with filtering)
  static async getDocuments(filters: {
    category?: string;
    permission?: string;
    customerId?: string;
    dealerId?: string;
    active?: boolean;
  } = {}) {
    try {
      let constraints: any[] = [];
      
      // Apply filters
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.permission) {
        constraints.push(where('permission', '==', filters.permission));
      }
      if (filters.customerId) {
        constraints.push(where('customer_id', '==', filters.customerId));
      }
      if (filters.dealerId) {
        constraints.push(where('dealer_id', '==', filters.dealerId));
      }
      if (filters.active !== undefined) {
        constraints.push(where('active', '==', filters.active));
      }
      
      // Order by creation date
      constraints.push(orderBy('created_at', 'desc'));
      
      const q = query(collection(db, 'documents'), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.debug('🔍 Documents query failed (index not ready), using fallback method');
        // Fallback: get all documents and filter client-side
        return this.getAllDocumentsWithFallback(filters);
      } else {
        console.error('Error fetching documents:', error);
        return [];
      }
    }
  }

  // Fallback method for documents when indexes are not ready
  static async getAllDocumentsWithFallback(filters: {
    category?: string;
    permission?: string;
    customerId?: string;
    dealerId?: string;
    active?: boolean;
  } = {}) {
    try {
      const snapshot = await getDocs(collection(db, 'documents'));
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Apply filters client-side
      if (filters.category) {
        docs = docs.filter(doc => doc.category === filters.category);
      }
      if (filters.permission) {
        docs = docs.filter(doc => doc.permission === filters.permission);
      }
      if (filters.customerId) {
        docs = docs.filter(doc => doc.customer_id === filters.customerId);
      }
      if (filters.dealerId) {
        docs = docs.filter(doc => doc.dealer_id === filters.dealerId);
      }
      if (filters.active !== undefined) {
        docs = docs.filter(doc => doc.active === filters.active);
      }
      
      // Sort by created_at (client-side)
      docs.sort((a, b) => {
        const aDate = new Date(a.created_at || 0);
        const bDate = new Date(b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });
      
      console.log(`✅ Loaded ${docs.length} documents via fallback method`);
      return docs;
    } catch (error) {
      console.debug('🔍 Fallback documents method failed:', error.message);
      return [];
    }
  }

  // Get customer uploads
  static async getCustomerUploads(customerId: string) {
    try {
      const q = query(
        collection(db, 'customer_uploads'),
        where('customer_id', '==', customerId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.debug('🔍 Customer uploads query failed (index not ready), using fallback method');
        // Fallback: get all uploads and filter client-side
        return this.getAllCustomerUploadsWithFallback(customerId);
      } else {
        console.error('Error fetching customer uploads:', error);
        throw error;
      }
    }
  }

  // Fallback method for customer uploads when indexes are not ready
  static async getAllCustomerUploadsWithFallback(customerId: string) {
    try {
      const snapshot = await getDocs(collection(db, 'customer_uploads'));
      let uploads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Filter by customer_id client-side
      uploads = uploads.filter(upload => upload.customer_id === customerId);
      
      // Sort by created_at (client-side)
      uploads.sort((a, b) => {
        const aDate = new Date(a.created_at || 0);
        const bDate = new Date(b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });
      
      console.log(`✅ Loaded ${uploads.length} customer uploads via fallback method`);
      return uploads;
    } catch (error) {
      console.debug('🔍 Fallback customer uploads method failed:', error.message);
      return [];
    }
  }



  // Update document by ID
  static async updateDocumentById(id: string, data: any) {
    try {
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date().toISOString()
      });
      return { id, ...data };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete document by ID
  static async deleteDocumentById(id: string) {
    try {
      await deleteDoc(doc(db, 'documents', id));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Add customer upload
  static async addCustomerUpload(data: any) {
    try {
      const logicalId = this.generateLogicalId('customer_uploads', data)
      const docRef = doc(db, 'customer_uploads', logicalId)
      await setDoc(docRef, {
        ...data,
        id: logicalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending', // pending, approved, rejected
        admin_notified: false
      });
      return { id: logicalId, ...data };
    } catch (error) {
      console.error('Error adding customer upload:', error);
      throw error;
    }
  }

  // Update customer upload status
  static async updateCustomerUploadStatus(id: string, status: 'pending' | 'approved' | 'rejected', adminNotes?: string) {
    try {
      const docRef = doc(db, 'customer_uploads', id);
      await updateDoc(docRef, {
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating customer upload status:', error);
      throw error;
    }
  }

  // Get notification count for customer uploads
  static async getCustomerUploadNotificationCount() {
    try {
      const q = query(
        collection(db, 'customer_uploads'),
        where('status', '==', 'pending'),
        where('admin_notified', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  // Mark customer upload as notified
  static async markCustomerUploadAsNotified(id: string) {
    try {
      const docRef = doc(db, 'customer_uploads', id);
      await updateDoc(docRef, {
        admin_notified: true,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error marking upload as notified:', error);
      throw error;
    }
  }
}

 