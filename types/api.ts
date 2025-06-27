export interface ApiProduct {
  id: string;
  name: string;
  price: string;
  description?: string;
  category_id?: string;
  category?: ApiCategory;
  colors: string[];
  sizes: string[];
  stock_quantity: number;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  price: string;
  description?: string;
  category_id?: string;
  colors: string[];
  sizes: string[];
  stock_quantity: number;
  images: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}