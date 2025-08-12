import { FirebaseService } from './firebase'

// Firebase wrapper functions for API routes
export async function getCustomers() {
    return await FirebaseService.getCustomers()
}

export async function getCustomerById(id: string) {
    return await FirebaseService.getCustomerById(id)
}

export async function addCustomer(customerData: any) {
    return await FirebaseService.addCustomer(customerData)
}

export async function updateCustomer(id: string, customerData: any) {
    return await FirebaseService.updateCustomer(id, customerData)
}

export async function deleteCustomer(id: string) {
    return await FirebaseService.deleteCustomer(id)
}

export async function getProducts() {
    return await FirebaseService.getProducts()
}

export async function addProduct(productData: any) {
    return await FirebaseService.addProduct(productData)
}

export async function updateProduct(id: string, productData: any) {
    return await FirebaseService.updateProduct(id, productData)
}

export async function getVatSettings() {
    return await FirebaseService.getVatSettings()
}

export async function updateVatSettings(id: string, vatData: any) {
  return await FirebaseService.updateVatSetting(id, vatData)
}

export async function getShippingSettings() {
    return await FirebaseService.getShippingSettings()
}

export async function updateShippingSettings(id: string, shippingData: any) {
    return await FirebaseService.updateShippingSettings(id, shippingData)
}

export async function getPaymentSettings() {
    return await FirebaseService.getPaymentSettings()
}

export async function updatePaymentSettings(id: string, paymentData: any) {
    return await FirebaseService.updatePaymentSettings(id, paymentData)
}

export async function getHeaderSettings() {
    return await FirebaseService.getHeaderSettings()
}

export async function updateHeaderSettings(id: string, headerData: any) {
    return await FirebaseService.updateHeaderSettings(id, headerData)
}

export async function getDhlSettings() {
    return await FirebaseService.getDhlSettings()
}

export async function updateDhlSettings(id: string, dhlData: any) {
    return await FirebaseService.updateDhlSettings(id, dhlData)
}

export async function getOrders() {
  return await FirebaseService.getOrders()
}

export async function getOrderById(id: string) {
  return await FirebaseService.getOrderById(id)
}

export async function addOrder(orderData: any) {
  return await FirebaseService.addOrder(orderData)
}

export async function updateOrder(id: string, orderData: any) {
  return await FirebaseService.updateOrder(id, orderData)
}

export async function getDealers() {
  return await FirebaseService.getDealers()
}

export async function createDealer(dealerData: any) {
  return await FirebaseService.createDealer(dealerData)
}

export async function updateDealer(id: string, dealerData: any) {
  return await FirebaseService.updateDealer(id, dealerData)
}

export async function deleteDealer(id: string) {
  return await FirebaseService.deleteDealer(id)
}

export async function getCustomerGroups() {
  return await FirebaseService.getCustomerGroups()
}

export async function createCustomerGroup(groupData: any) {
  return await FirebaseService.createCustomerGroup(groupData)
}

export async function updateCustomerGroup(id: string, groupData: any) {
  return await FirebaseService.updateCustomerGroup(id, groupData)
}

export async function deleteCustomerGroup(id: string) {
  return await FirebaseService.deleteCustomerGroup(id)
}

export async function getCMSPages() {
  return await FirebaseService.getCMSPages()
}

export async function createCMSPage(pageData: any) {
  return await FirebaseService.createCMSPage(pageData)
}

export async function updateCMSPage(id: string, pageData: any) {
  return await FirebaseService.updateCMSPage(id, pageData)
}

export async function deleteCMSPage(id: string) {
    return await FirebaseService.deleteCMSPage(id)
}

// Categories
export async function getCategories() {
    return await FirebaseService.getCategories()
}

export async function getCategoryById(id: string) {
    return await FirebaseService.getCategoryById(id)
}

export async function createCategory(categoryData: any) {
    return await FirebaseService.createCategory(categoryData)
}

export async function updateCategory(id: string, categoryData: any) {
    return await FirebaseService.updateCategory(id, categoryData)
}

export async function deleteCategory(id: string) {
    return await FirebaseService.deleteCategory(id)
} 