import { ApiProduct, ApiCategory, CreateProductRequest, UpdateProductRequest } from '@/types/api';
import { Product } from '@/types/Product';
import { StorageService } from './StorageService';

const API_BASE_URL = 'https://sandyspace.com';

// New types for the Laravel API response
export interface LaravelProduct {
  id: number;
  name: string;
  code: string;
  brand: string;
  category: string;
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
}

export interface ProductFilters {
  search?: string;
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
// Fetch single product details with authorization and main image handling
async getProductDetails(id: string): Promise<Product> {
  const endpoint = `/api/products/details/${id}?userid=1`;

  try {
    const response = await this.request<{ product: LaravelProduct }>(endpoint);

    // Use existing converter for LaravelProduct
    return this.convertLaravelProductToProduct(response.product);
  } catch (error) {
    console.error(`Failed to fetch product details for ID ${id}`, error);
    throw error;
  }
}
  // Convert Laravel product to our Product type
  private convertLaravelProductToProduct(laravelProduct: LaravelProduct): Product {
    // Extract variants from product name or description if available
    // This is a simplified approach - you might need to adjust based on your data structure
    const colors: string[] = [];
    const sizes: string[] = [];
    
    // If it's a variant product, we might need to fetch variant details separately
    // For now, we'll use placeholder data
    if (laravelProduct.is_variant) {
      // You might want to make a separate API call to get variant details
      // or include variant data in the main response
      colors.push('Default');
      sizes.push('Default');
    }

    return {
      id: laravelProduct.id.toString(),
      name: laravelProduct.name,
      price: laravelProduct.price.toString(),
      description: `${laravelProduct.product_details || ''}`, // Ensure description is a string
      category: laravelProduct.category,
      colors: colors,
      sizes: sizes,
      stockQuantity: laravelProduct.qty,
      images: laravelProduct.image_url ? [laravelProduct.image_url] : [],
      createdAt: laravelProduct.created_at,
      updatedAt: laravelProduct.created_at,
      // Additional fields from Laravel
      code: laravelProduct.code,
      brand: laravelProduct.brand,
      unit: laravelProduct.unit,
      cost: laravelProduct.cost,
      stock_worth: laravelProduct.stock_worth,
      type: laravelProduct.type,
      alert_quantity: laravelProduct.alert_quantity,
      is_variant: laravelProduct.is_variant,
    };
  }

  // New method to get products with filters using your Laravel API
  async getProductsWithFilters(filters: ProductFilters = {}): Promise<{
    products: Product[];
    pagination: ProductListingResponse['pagination'];
    appliedFilters: ProductListingResponse['filters'];
  }> {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
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
      
      if (!response.success) {
        throw new Error('API returned unsuccessful response');
      }

      const products = response.data.map(this.convertLaravelProductToProduct);
      
      return {
        products,
        pagination: response.pagination,
        appliedFilters: response.filters,
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
        id: parseInt(product.id),
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

  async updateProduct(id: string, updates: Partial<UpdateProductRequest>): Promise<ApiProduct> {
    return this.request<ApiProduct>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request<void>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<ApiCategory[]> {
    return this.request<ApiCategory[]>('/api/categories');
  }

  // Upload image to server and get URL back
  async uploadImage(imageUri: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const settings = await StorageService.getSettings();
      const apiEndpoint = settings.apiEndpoint || API_BASE_URL;

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
        const response = await fetch(`${apiEndpoint}/upload`, {
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
      const settings = await StorageService.getSettings();
      const apiEndpoint = settings.apiEndpoint || API_BASE_URL;

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
  async uploadProductToSandySpace(
    product: Product,
    imageUris: string[]
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const settings = await StorageService.getSettings();
      const apiEndpoint = settings.apiEndpoint || API_BASE_URL;
      
      // Prepare payload based on the product data
      const payload = {
        type: "standard",
        name: product.name,
        code: Math.floor(Math.random() * 100000000).toString(),
        barcode_symbology: "C128",
        product_code_name: "",
        brand_id: "",
        category_id: product.category,
        unit_id: 1,
        sale_unit_id: 1,
        purchase_unit_id: 1,
        cost: parseFloat(product.price) * 0.7, // Assume 30% markup
        price: product.price < 100 ? parseFloat(product.price) * 1000 : parseFloat(product.price),
        qty: product.stockQuantity,
        wholesale_price: "",
        daily_sale_objective: "",
        alert_quantity: "",
        tax_id: "",
        tax_method: 1,
        warranty: "",
        warranty_type: "months",
        guarantee: "",
        guarantee_type: "months",
        stock_warehouse_id: [1, 2],
        stock: [product.stockQuantity.toString(), ""],
        product_details: product.description || "",
        variant_option: [],
        variant_value: [],
        warehouse_id: [1, 2],
        diff_price: ["", ""],
        promotion_price: "",
        starting_date: "",
        last_date: "",
        is_online: 1,
        in_stock: product.stockQuantity > 0 ? 1 : 0,
        tags: "",
        meta_title: product.name,
        meta_description: product.description || "",
        products: ""
      };

      // Create form data
      const formData = new FormData();
      
      // Append all non-array fields from payload
      for (const [key, value] of Object.entries(payload)) {
        if (!Array.isArray(value)) {
          formData.append(key, value.toString());
        }
      }
      
      // Handle array fields separately
      if (payload.stock_warehouse_id) {
        payload.stock_warehouse_id.forEach((id, index) => {
          formData.append(`stock_warehouse_id[${index}]`, id.toString());
        });
      }
      
      if (payload.warehouse_id) {
        payload.warehouse_id.forEach((id, index) => {
          formData.append(`warehouse_id[${index}]`, id.toString());
        });
      }
      
      if (payload.stock) {
        payload.stock.forEach((stock, index) => {
          formData.append(`stock[${index}]`, stock.toString());
        });
      }
      
      if (payload.diff_price) {
        payload.diff_price.forEach((price, index) => {
          formData.append(`diff_price[${index}]`, price.toString());
        });
      }
      
      // Handle variants (colors and sizes)
      if (product.colors.length > 0 || product.sizes.length > 0) {
        // Set is_variant flag
        formData.append('is_variant', '1');
        
        // Group variants by type
        const variantsByType: Record<string, string[]> = {};
        
        if (product.colors.length > 0) {
          variantsByType['Couleur'] = product.colors;
        }
        
        if (product.sizes.length > 0) {
          variantsByType['Taille'] = product.sizes;
        }
        
        // Add variant options and values
        Object.entries(variantsByType).forEach(([typeName, values], index) => {
          formData.append(`variant_option[]`, typeName);
          formData.append(`variant_value[]`, values.join(','));
        });
        
        // Generate all possible combinations
        const variantTypes = Object.keys(variantsByType);
        const variantValues = Object.values(variantsByType);
        
        // Generate all combinations of variant values
        const generateCombinations = (
          current: string[] = [],
          depth: number = 0
        ): string[][] => {
          if (depth === variantTypes.length) {
            return [current];
          }
          
          let result: string[][] = [];
          for (const value of variantValues[depth]) {
            result = result.concat(
              generateCombinations([...current, value], depth + 1)
            );
          }
          
          return result;
        };
        
        const combinations = generateCombinations();
        
        // Add each combination as a variant
        combinations.forEach((combo, index) => {
          const variantName = combo.join('/');
          const itemCode = `${variantName}-${payload.code}`;
          
          formData.append(`variant_name[]`, variantName);
          formData.append(`item_code[]`, itemCode);
          formData.append(`additional_cost[]`, "0");
          formData.append(`additional_price[]`, "0");
        });
      }
      
      // Append images
      if (imageUris && imageUris.length > 0) {
        imageUris.forEach((uri, index) => {
          // Extract file name and type from URI
          const uriParts = uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          const fileName = `product_image_${index}.${fileType}`;
          
          // Append image to form data
          formData.append(`image[${index}]`, {
            uri: uri,
            name: fileName,
            type: `image/${fileType}`
          } as any);
        });
      }
      
      // Add timeout for upload
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for product upload
      
      try {
        // Upload to SandySpace API
        const response = await fetch('https://sandyspace.com/api-products', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Content-Type': 'multipart/form-data',
            // Add any additional headers if needed
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        const responseData = await response.json();
        return { success: true, response: responseData };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Failed to upload product to SandySpace:', error);
      
      let errorMessage = 'Unknown error occurred during product upload';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Product upload timeout - please try again';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to SandySpace server';
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
}

export const apiService = new ApiService();