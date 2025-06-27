import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Sale } from '@/types/Product';

const PRODUCTS_KEY = 'sandyspace_products';
const SALES_KEY = 'sandyspace_sales';
const SETTINGS_KEY = 'sandyspace_settings';

export class StorageService {
  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return [];
    }
  }

  static async saveProducts(products: Product[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des produits:', error);
    }
  }

  static async addProduct(product: Product): Promise<void> {
    const products = await this.getProducts();
    products.push(product);
    await this.saveProducts(products);
  }

  static async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveProducts(products);
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    await this.saveProducts(filtered);
  }

  // Sales
  static async getSales(): Promise<Sale[]> {
    try {
      const data = await AsyncStorage.getItem(SALES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes:', error);
      return [];
    }
  }

  static async addSale(sale: Sale): Promise<void> {
    try {
      const sales = await this.getSales();
      sales.push(sale);
      await AsyncStorage.setItem(SALES_KEY, JSON.stringify(sales));
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la vente:', error);
    }
  }

  // Settings
  static async getSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return {};
    }
  }

  static async updateSettings(settings: any): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
    }
  }
}