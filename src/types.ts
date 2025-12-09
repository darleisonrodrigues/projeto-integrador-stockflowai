export interface Supplier {
  id: string;
  companyName: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  contactName: string;
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  phone: string;
  email: string;
  zipCode: string; // CEP
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  type: 'PF' | 'PJ';
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  description: string;
  quantity: number;
  category: string;
  expiryDate?: string;
  imageUrl?: string;
  supplierIds: string[]; // Armazenamento de relacionamento Muitos-para-Muitos
}



export interface Notification {
  type: 'success' | 'error';
  message: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  supplierId: string;
  supplierName?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  date: string;
  totalAmount: number;
  items?: OrderItem[];
}

export interface SaleItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  active: boolean;
}

export interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  status: 'QUOTE' | 'COMPLETED';
  date: string;
  totalAmount: number;
  notes?: string;
  items?: SaleItem[];
}

export interface AppSettings {
  companyName: string;
  cnpj: string;
  email: string;
  phone: string;
  address?: string; // Campo legado
  addressStreet?: string;
  addressNumber?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
}

export type ViewState = 'dashboard' | 'products' | 'suppliers' | 'clients' | 'orders' | 'sales' | 'reports' | 'product-details' | 'products-low-stock' | 'products-expiring' | 'settings' | 'users';