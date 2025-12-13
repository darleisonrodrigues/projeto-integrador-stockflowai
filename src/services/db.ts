import { Product, Supplier, Order, Sale, Client } from '../types';
import { api, API_URL } from './api';

class DatabaseService {
  // --- Suppliers ---

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const response = await api.post('/suppliers', supplier);
    return { ...supplier, id: response.id };
  }

  async listSuppliers(): Promise<Supplier[]> {
    return api.get('/suppliers');
  }

  async updateSupplier(id: string, supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    return api.put(`/suppliers/${id}`, supplier);
  }

  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }

  // --- Clients ---

  async createClient(client: Omit<Client, 'id'>): Promise<Client> {
    const response = await api.post('/clients', client);
    return { ...client, id: response.id };
  }

  async listClients(): Promise<Client[]> {
    return api.get('/clients');
  }

  async updateClient(id: string, client: Omit<Client, 'id'>): Promise<Client> {
    const response = await api.put(`/clients/${id}`, client);
    return response;
  }

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  }

  // --- Products ---

  async createProduct(product: Omit<Product, 'id' | 'supplierIds'>): Promise<Product> {
    const response = await api.post('/products', product);
    return { ...product, id: response.id, supplierIds: [] };
  }

  async listProducts(): Promise<Product[]> {
    return api.get('/products');
  }

  async updateProduct(id: string, product: FormData): Promise<Product> {
    const response = await api.put(`/products/${id}`, product);
    return response;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }

  // --- Associations ---

  async associateSupplier(productId: string, supplierId: string): Promise<void> {
    await api.post('/associations', { productId, supplierId });
  }

  async disassociateSupplier(productId: string, supplierId: string): Promise<void> {
    await api.delete(`/products/${productId}/suppliers/${supplierId}`);
  }

  async getSuppliersByProduct(productId: string): Promise<Supplier[]> {
    return api.get(`/products/${productId}/suppliers`);
  }

  // --- Orders ---

  async createOrder(order: { supplierId: string; items: any[]; totalAmount: number }): Promise<{ id: string }> {
    return api.post('/orders', order);
  }

  async listOrders(): Promise<Order[]> {
    return api.get('/orders');
  }

  async receiveOrder(id: string): Promise<void> {
    await api.post(`/orders/${id}/receive`, {});
  }

  async updateOrder(id: string, order: { supplierId: string; items: any[]; totalAmount: number }): Promise<void> {
    await api.put(`/orders/${id}`, order);
  }

  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/orders/${id}`);
  }

  // --- Sales ---

  async createSale(sale: { items: any[]; totalAmount: number; notes: string }): Promise<{ id: string }> {
    return api.post('/sales', sale);
  }

  async listSales(): Promise<Sale[]> {
    return api.get('/sales');
  }

  // --- Settings ---

  async getSettings(): Promise<any> {
    const response = await api.get('/api/settings');
    return response;
  }

  async updateSettings(settings: any): Promise<void> {
    await api.post('/api/settings', settings);
  }

  async downloadBackup(): Promise<void> {
    const blob = await api.downloadBlob('/api/backup/download');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockflow-backup-${new Date().toISOString().split('T')[0]}.db`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async uploadBackup(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('backup', file);
    await api.post('/api/backup/restore', formData);
  }

  async resetDatabase(): Promise<void> {
    await api.post('/api/database/reset', {});
  }
}

export const db = new DatabaseService();