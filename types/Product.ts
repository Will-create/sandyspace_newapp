export interface Product {
  id: string;
  name: string;
  code: string;
  price: string;
  description?: string;
  category?: string;
  colors: string[];
  sizes: string[];
  stockQuantity: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
  cost?: string;
  categoryId?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  type: 'color' | 'size';
  values: string[];
  additionalCost?: number;
  additionalPrice?: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  size?: string;
  color?: string;
  unitPrice: string;
  totalPrice: string;
  paymentMethod: 'cash' | 'mobile-money' | 'credit';
  timestamp: string;
}

export interface AIProductResult {
  name: string;
  price: string;
  colors: string[];
  sizes: string[];
  description: string;
  category: string;
}

export interface ImageUploadItem {
  id: string;
  uri: string;
  caption: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: AIProductResult;
  error?: string;
}

export interface UploadQueue {
  items: ImageUploadItem[];
  currentIndex: number;
  isProcessing: boolean;
}