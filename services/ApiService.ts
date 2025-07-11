import { ApiProduct, ApiCategory, CreateProductRequest, UpdateProductRequest } from '@/types/api';
import { Product, ProductVariant } from '@/types/Product';
import { StorageService } from './StorageService';

const API_BASE_URL = 'https://sandyspace.com';

// New types for the Laravel API response
export interface LaravelProduct {
  id: string;
  name: string;
  sizes: string;
  colors: string;
  code: string;
  brand: string;
  category: string;
  category_id: number;
  unit: string;
  price: number;
  product_details: string;
  cost: any;
  qty: number;
  stock_worth: string;
  image_url: string;
  main_image?: string; // <-- Add this
  type: string;
  alert_quantity: number;
  is_variant: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}
interface FilterOptions {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: number; name: string }>;
}
export interface ProductListingResponse {
  success: boolean;
  data: LaravelProduct[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: {
    search: string;
    category_id: string;
    brand_id: string;
    warehouse_id: number;
    sort_by: string;
    sort_order: string;
  };
  options: FilterOptions;
}

export interface ProductFilters {
  search?: string;
  arrivage?: boolean;
  category_id?: string;
  brand_id?: string;
  warehouse_id?: number;
  sort_by?: 'name' | 'price' | 'cost' | 'created_at';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to server - please check if the API server is running');
        }
      }
      
      throw error;
    }
  }

  // deleteProducts for multiple products deletion
  async deleteProducts(ids: string[]): Promise<void> {
    const endpoint = '/api/products/delete';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    };
    await this.request(endpoint, options);

  }
   

// Fetch single product details with authorization and main image handling
async getProductDetails(id: string): Promise<Product> {
  const endpoint = `/api/products/details/${id}?userid=1`;

  try {
    const response = await this.request<{ product: LaravelProduct, variants: ProductVariant[] }>(endpoint);

    // Use existing converter for LaravelProduct
    return this.convertLaravelProductToProduct(response.product, response.variants);
  } catch (error) {
    console.error(`Failed to fetch product details for ID ${id}`, error);
    throw error;
  }
}
  // Convert Laravel product to our Product type
  private convertLaravelProductToProduct(laravelProduct: LaravelProduct, variants: ProductVariant[] = []): Product {
    // Extract variants from product name or description if available
    // This is a simplified approach - you might need to adjust based on your data structure
    const colors: string[] = laravelProduct.colors?.split(',').map(color => color.trim()) || [];
    const sizes: string[] = laravelProduct.sizes?.split(',').map(size => size.trim()) || [];
    console.log(laravelProduct.qty);
    // If it's a variant product, we might need to fetch variant details separately
    // For now, we'll use placeholder data

    return {
      id: laravelProduct.id,
      name: laravelProduct.name,
      price: laravelProduct.price.toString(),
      description: `${laravelProduct.product_details || ''}`, // Ensure description is a string
      category: laravelProduct.category,
      category_id: laravelProduct.category_id,
      colors: colors,
      sizes: sizes,
      stockQuantity: laravelProduct.qty,
      images: laravelProduct.image_url ? [laravelProduct.image_url] : [],
      createdAt: laravelProduct.created_at,
      updatedAt: laravelProduct.created_at,
      code: laravelProduct.code,
      brand: laravelProduct.brand,
      unit: laravelProduct.unit,
      cost: laravelProduct.cost,
      stock_worth: laravelProduct.stock_worth,
      type: laravelProduct.type,
      alert_quantity: laravelProduct.alert_quantity,
      is_variant: laravelProduct.is_variant,
      variants: variants,
      main_image: laravelProduct.main_image,
    };
  }

  // New method to get products with filters using your Laravel API
  async getProductsWithFilters(filters: ProductFilters = {}): Promise<{
    products: Product[];
    pagination: ProductListingResponse['pagination'];
    appliedFilters: ProductListingResponse['filters'];
    options: FilterOptions;
  }> {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters.arrivage) queryParams.append('arrivage', filters.arrivage);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.brand_id) queryParams.append('brand_id', filters.brand_id);
    if (filters.warehouse_id) queryParams.append('warehouse_id', filters.warehouse_id.toString());
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
    if (filters.per_page) queryParams.append('per_page', filters.per_page.toString());
    if (filters.page) queryParams.append('page', filters.page.toString());

    const endpoint = `/api/products/listing${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await this.request<ProductListingResponse>(endpoint);
      console.log(response);
      const products = response.data?.map((product) => this.convertLaravelProductToProduct(product, product.variants));
      return {
        products,
        pagination: response.pagination,
        appliedFilters: response.filters,
        options: response.options,
      };
    } catch (error) {
      console.error('Error fetching products with filters:', error);
      throw error;
    }
  }

  // Legacy method for compatibility - now uses the new filtered endpoint
  async getProducts(): Promise<ApiProduct[]> {
    try {
      const result = await this.getProductsWithFilters({ per_page: 100 });
      
      // Convert to legacy ApiProduct format for compatibility
      return result.products.map(product => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        description: product.description || '',
        category: product.category ? { name: product.category } : undefined,
        colors: product.colors,
        sizes: product.sizes,
        stock_quantity: product.stockQuantity,
        images: product.images,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      }));
    } catch (error) {
      console.error('Error in legacy getProducts method:', error);
      throw error;
    }
  }

  // Get available filter options (categories, brands, etc.)
  async getFilterOptions(): Promise<{
    categories: Array<{ id: string; name: string }>;
    brands: Array<{ id: string; name: string }>;
    warehouses: Array<{ id: number; name: string }>;
  }> {
    try {
      // You might want to create separate endpoints for these
      // For now, we'll return empty arrays or make separate API calls
      const [categories, brands] = await Promise.all([
        this.getCategories().catch(() => []),
        // You might need to create a getBrands method
        Promise.resolve([])
      ]);

      return {
        categories: categories.map(cat => ({ id: cat.id.toString(), name: cat.name })),
        brands: [], // Add brands API call when available
        warehouses: [
          { id: 0, name: 'All Warehouses' },
          { id: 1, name: 'Main Warehouse' },
          { id: 2, name: 'Secondary Warehouse' },
        ],
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        categories: [],
        brands: [],
        warehouses: [{ id: 0, name: 'All Warehouses' }],
      };
    }
  }

  async getProduct(id: string): Promise<ApiProduct> {
    return this.request<ApiProduct>(`/api/products/${id}`);
  }

  async createProduct(product: CreateProductRequest): Promise<ApiProduct> {
    return this.request<ApiProduct>('/api/products/create', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

 async updateProduct(data: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/products/save`, {
    method: 'POST', // or PUT/PATCH depending on your Laravel route
    headers: {
      Accept: 'application/json',
    },
    body: data,
  });
  if (!response.ok) throw new Error('Erreur API');
  return await response.json();
}

async deleteProduct(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erreur API');
  return await response.json();
}

  // Categories
  async getCategories(): Promise<ApiCategory[]> {
    return this.request<ApiCategory[]>('/api/categories');
  }

  // Upload image to server and get URL back
  async uploadImage(imageUri: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const settings = await StorageService.getSettings();
      const apiEndpoint =  API_BASE_URL;

      // Create form data with image
      const formData = new FormData();
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      // Add timeout for upload
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for uploads

      try {
        // Upload image
        const response = await fetch(`${apiEndpoint}/api/products/upload`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        return { success: true, url: data.url };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Upload timeout - please try again';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Send product data to server
  async syncProduct(product: Product): Promise<{ success: boolean; error?: string }> {
    try {
      const apiEndpoint = API_BASE_URL;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${apiEndpoint}/api/update`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        return { success: true };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Failed to sync product:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Sync timeout - please try again';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Sync multiple products
  async syncProducts(products: Product[]): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    try {
      const settings = await StorageService.getSettings();
      const apiEndpoint = settings.apiEndpoint || API_BASE_URL;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for batch operations

      try {
        const response = await fetch(`${apiEndpoint}/api/update-batch`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ products }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        return { success: true, syncedCount: products.length };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Failed to sync products:', error);
      
      let errorMessage = 'Unknown error occurred during product sync';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Batch sync timeout - please try again';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        success: false, 
        syncedCount: 0,
        error: errorMessage
      };
    }
  }

  // Upload product with images to SandySpace API (keeping existing implementation)
async uploadProductToSandySpace(product: Product, imageUris: string[]) {
  try {
    const settings = await StorageService.getSettings();
    const apiEndpoint = settings.apiEndpoint || API_BASE_URL;

    const formData = new FormData();
    const code = product.code || Math.floor(Math.random() * 100000000).toString();
    const price = parseFloat(product.price);
    const cost = price * 0.7;

    const payload = {
      id: product.id || '',
      name: product.name,
      type: 'standard',
      code: code,
      colors: product.colors.join(','),
      sizes: product.sizes.join(','),
      barcode_symbology: 'C128',
      category_id: product.category,
      unit_id: 1,
      sale_unit_id: 1,
      purchase_unit_id: 1,
      cost: cost,
      price: price < 100 ? price * 1000 : price,
      qty: product.stockQuantity,
      in_stock: product.stockQuantity > 0 ? 1 : 0,
      is_online: 1,
      product_details: product.description || '',
      meta_title: product.name,
      meta_description: product.description || '',

      // 👇 Required for Product_Warehouse
      warehouse_quantities: { '1': product.stockQuantity.toString() },
    };

    // FormData appending with support for nested objects
    for (const [key, val] of Object.entries(payload)) {
      if (Array.isArray(val)) {
        val.forEach((v, i) => formData.append(`${key}[${i}]`, v.toString()));
      } else if (typeof val === 'object' && val !== null) {
        for (const [subKey, subVal] of Object.entries(val)) {
          formData.append(`${key}[${subKey}]`, subVal.toString());
        }
      } else {
        val && formData.append(key, val.toString());
      }
    }

    // Variants
    if (product.colors.length || product.sizes.length) {
      formData.append('is_variant', '1');

      if (product.colors.length > 0) {
        formData.append('variant_option[]', 'Couleur');
        formData.append('variant_value[]', product.colors.join(','));
      }

      if (product.sizes.length > 0) {
        formData.append('variant_option[]', 'Taille');
        formData.append('variant_value[]', product.sizes.join(','));
      }

      const generateCombinations = (arrays: any[], prefix: string[] = []) => {
        if (!arrays.length) return [prefix];
        return arrays[0].flatMap((v: string) =>
          generateCombinations(arrays.slice(1), [...prefix, v])
        );
      };

      const combos = generateCombinations([
        product.colors.length ? product.colors : [''],
        product.sizes.length ? product.sizes : ['']
      ]);

      combos.forEach((combo: string[]) => {
        const variantName = combo.filter(Boolean).join('/');
        const itemCode = `${variantName}-${code}`;
        formData.append('variant_name[]', variantName);
        formData.append('item_code[]', itemCode);
        formData.append('additional_price[]', '0');
        formData.append('additional_cost[]', '0');
      });
    }

    // Images
    imageUris.forEach((uri, i) => {
      const ext = uri.split('.').pop();
      const filename = `product_image_${i}.${ext}`;
      formData.append('image[]', {
        uri,
        name: filename,
        type: `image/${ext}`,
      });
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${apiEndpoint}/api/products/save`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return { success: true, response: result };

  } catch (error: any) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message || 'Unknown error',
    };
  }
}



}

export const apiService = new ApiService();