import { FirebaseService } from './firebase'
import { Client } from 'pg'

export interface DatabaseService {
  getCustomers(): Promise<any[]>
  createCustomer(customer: any): Promise<any>
  updateCustomer(customer: any): Promise<any>
  deleteCustomer(id: string): Promise<any>
  getProducts(): Promise<any[]>
  getCmsPages(): Promise<any[]>
}

export class FirebaseDatabaseService implements DatabaseService {
  async getCustomers() {
    return await FirebaseService.getCustomers()
  }

  async createCustomer(customer: any) {
    return await FirebaseService.addCustomer(customer)
  }

  async updateCustomer(customer: any) {
    return await FirebaseService.updateCustomer(customer.id, customer)
  }

  async deleteCustomer(id: string) {
    return await FirebaseService.deleteCustomer(id)
  }

  async getProducts() {
    return await FirebaseService.getProducts()
  }

  async getCmsPages() {
    return await FirebaseService.getCMSPages()
  }
}

export class PostgreSQLDatabaseService implements DatabaseService {
  private client: Client

  constructor() {
    this.client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'alloygator',
      user: 'herbertkats',
      password: 'RoLiRa1998',
    })
  }

  async getCustomers() {
    try {
      await this.client.connect()
      const result = await this.client.query(`
        SELECT * FROM customers WHERE status = 'active'
      `)
      await this.client.end()
      return result.rows
    } catch (error) {
      await this.client.end()
      throw error
    }
  }

  async createCustomer(customer: any) {
    try {
      await this.client.connect()
      const result = await this.client.query(`
        INSERT INTO customers (id, email, first_name, last_name, company_name, phone, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `, [customer.email, customer.first_name, customer.last_name, customer.company_name, customer.phone])
      await this.client.end()
      return result.rows[0]
    } catch (error) {
      await this.client.end()
      throw error
    }
  }

  async updateCustomer(customer: any) {
    try {
      await this.client.connect()
      const result = await this.client.query(`
        UPDATE customers 
        SET first_name = $1, last_name = $2, company_name = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
        WHERE email = $5
      `, [customer.first_name, customer.last_name, customer.company_name, customer.phone, customer.email])
      await this.client.end()
      return result
    } catch (error) {
      await this.client.end()
      throw error
    }
  }

  async deleteCustomer(id: string) {
    try {
      await this.client.connect()
      const result = await this.client.query(`
        UPDATE customers SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [id])
      await this.client.end()
      return result
    } catch (error) {
      await this.client.end()
      throw error
    }
  }

  async getProducts() {
    try {
      await this.client.connect()
      const result = await this.client.query(`
        SELECT * FROM products WHERE status = 'active'
      `)
      await this.client.end()
      return result.rows
    } catch (error) {
      await this.client.end()
      throw error
    }
  }

  async getCmsPages() {
    try {
      await this.client.connect()
      const result = await this.client.query(`
        SELECT * FROM cms_pages
      `)
      await this.client.end()
      return result.rows
    } catch (error) {
      await this.client.end()
      throw error
    }
  }
}

// Database Manager die kan schakelen tussen beide
export class DatabaseManager {
  private firebaseService: FirebaseDatabaseService
  private postgresService: PostgreSQLDatabaseService
  private usePostgreSQL: boolean = false

  constructor() {
    this.firebaseService = new FirebaseDatabaseService()
    this.postgresService = new PostgreSQLDatabaseService()
  }

  // Schakel tussen databases
  setUsePostgreSQL(use: boolean) {
    this.usePostgreSQL = use
    console.log(`Switched to ${use ? 'PostgreSQL' : 'Firebase'} database`)
  }

  // Krijg de actieve database service
  private getActiveService(): DatabaseService {
    return this.usePostgreSQL ? this.postgresService : this.firebaseService
  }

  // Database operaties
  async getCustomers() {
    return await this.getActiveService().getCustomers()
  }

  async createCustomer(customer: any) {
    return await this.getActiveService().createCustomer(customer)
  }

  async updateCustomer(customer: any) {
    return await this.getActiveService().updateCustomer(customer)
  }

  async deleteCustomer(id: string) {
    return await this.getActiveService().deleteCustomer(id)
  }

  async getProducts() {
    return await this.getActiveService().getProducts()
  }

  async getCmsPages() {
    return await this.getActiveService().getCmsPages()
  }

  // Dual write (schrijf naar beide databases)
  async dualWrite(operation: 'create' | 'update' | 'delete', data: any) {
    try {
      // Schrijf naar PostgreSQL
      if (operation === 'create') {
        await this.postgresService.createCustomer(data)
      } else if (operation === 'update') {
        await this.postgresService.updateCustomer(data)
      } else if (operation === 'delete') {
        await this.postgresService.deleteCustomer(data)
      }

      // Schrijf naar Firebase (legacy)
      if (operation === 'create') {
        await this.firebaseService.createCustomer(data)
      } else if (operation === 'update') {
        await this.firebaseService.updateCustomer(data)
      } else if (operation === 'delete') {
        await this.firebaseService.deleteCustomer(data)
      }

      return { success: true, message: 'Data written to both databases' }
    } catch (error) {
      console.error('Dual write error:', error)
      throw error
    }
  }
}

// Export een singleton instance
export const databaseManager = new DatabaseManager()
