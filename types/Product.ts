export interface Product {
  id: string;
  name: string;
  code: string;
  price: string;
  description?: string;
  category?: string;
  category_id?: number;
  cost?: string;
  stockQuantity: number;
  images: string[];
  colors: string[];
  sizes: string[];
  createdAt: string;
  brand?: string;
  unit?: string;
  type?: string;
  alert_quantity?: number;
  updatedAt: string;
  is_variant?: boolean;
  variantOptions?: string[]; // Example: ['Size', 'Color']
  variantValues?: string[];  // Example: ['S', 'M', 'L', 'Red', 'Blue']
  variants?: ProductVariant[];
  file?: string;
  stock_worth?: string;
  main_image?: string;
  warranty?: string;
  warranty_type?: string; 
  guarantee?: string;
  guarantee_type?: string;
  starting_date?: string;
  last_date?: string;
}

export interface ProductVariant {
  name: string;            // Variant name like "Red", "XL"
  item_code: string;       // SKU or code for the variant
  additional_price: string; // extra selling price
  additional_cost: string;  // extra cost price
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