import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy, limit, doc, getDoc, addDoc, updateDoc, deleteDoc, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.firebasestorage.app",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79",
  measurementId: "G-QY0QVXYJ5H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
  // Get all products
  static async getProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
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
      const querySnapshot = await getDocs(collection(db, 'cms_pages'));
      const pages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return pages;
    } catch (error) {
      console.error('Error fetching CMS pages:', error);
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
      const footer = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return footer[0] || null;
    } catch (error) {
      console.error('Error fetching footer:', error);
      return null;
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
      const docRef = await addDoc(collection(db, collectionName), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // Update document
  static async updateDocument(collectionName: string, id: string, data: any) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
      return { id, ...data };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  static async deleteDocument(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
}

 