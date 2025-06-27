import { Product, Sale } from '@/types/Product';

export class MockDataService {
  static getMockProducts(): Product[] {
    return [
      {
        id: '1',
        name: 'Robe Élégante Rouge',
        price: '25000',
        description: 'Belle robe rouge parfaite pour les occasions spéciales',
        category: 'Robes',
        colors: ['rouge', 'noir', 'bleu'],
        sizes: ['S', 'M', 'L', 'XL'],
        stockQuantity: 15,
        images: ['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        cost: '18000',
        categoryId: 'cat1',
      },
      {
        id: '2',
        name: 'Chemise Blanche Classique',
        price: '15000',
        description: 'Chemise blanche élégante pour le bureau',
        category: 'Chemises',
        colors: ['blanc', 'bleu clair', 'rose'],
        sizes: ['S', 'M', 'L'],
        stockQuantity: 8,
        images: ['https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-16T09:30:00Z',
        updatedAt: '2024-01-16T09:30:00Z',
        cost: '11000',
        categoryId: 'cat2',
      },
      {
        id: '3',
        name: 'Pantalon Jean Délavé',
        price: '20000',
        description: 'Jean confortable avec coupe moderne',
        category: 'Pantalons',
        colors: ['bleu délavé', 'noir', 'gris'],
        sizes: ['28', '30', '32', '34', '36'],
        stockQuantity: 12,
        images: ['https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-17T14:15:00Z',
        updatedAt: '2024-01-17T14:15:00Z',
        cost: '14000',
        categoryId: 'cat3',
      },
      {
        id: '4',
        name: 'Chaussures Sport Noires',
        price: '35000',
        description: 'Baskets confortables pour le sport et le quotidien',
        category: 'Chaussures',
        colors: ['noir', 'blanc', 'rouge'],
        sizes: ['38', '39', '40', '41', '42', '43'],
        stockQuantity: 6,
        images: ['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-18T11:45:00Z',
        updatedAt: '2024-01-18T11:45:00Z',
        cost: '25000',
        categoryId: 'cat4',
      },
      {
        id: '5',
        name: 'Sac à Main Cuir',
        price: '45000',
        description: 'Sac à main en cuir véritable de haute qualité',
        category: 'Accessoires',
        colors: ['marron', 'noir', 'beige'],
        sizes: ['Unique'],
        stockQuantity: 4,
        images: ['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-19T16:20:00Z',
        updatedAt: '2024-01-19T16:20:00Z',
        cost: '32000',
        categoryId: 'cat5',
      },
      {
        id: '6',
        name: 'Bijoux Collier Doré',
        price: '12000',
        description: 'Collier élégant plaqué or',
        category: 'Bijoux',
        colors: ['doré', 'argenté'],
        sizes: ['Unique'],
        stockQuantity: 20,
        images: ['https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-20T13:10:00Z',
        updatedAt: '2024-01-20T13:10:00Z',
        cost: '8000',
        categoryId: 'cat6',
      },
      {
        id: '7',
        name: 'Téléphone Portable',
        price: '150000',
        description: 'Smartphone dernière génération',
        category: 'Électronique',
        colors: ['noir', 'blanc', 'bleu'],
        sizes: ['128GB', '256GB'],
        stockQuantity: 3,
        images: ['https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-21T08:30:00Z',
        updatedAt: '2024-01-21T08:30:00Z',
        cost: '120000',
        categoryId: 'cat7',
      },
      {
        id: '8',
        name: 'Coussin Décoratif',
        price: '8000',
        description: 'Coussin décoratif pour salon',
        category: 'Maison',
        colors: ['bleu', 'vert', 'jaune', 'rouge'],
        sizes: ['40x40cm', '50x50cm'],
        stockQuantity: 25,
        images: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-22T15:45:00Z',
        updatedAt: '2024-01-22T15:45:00Z',
        cost: '5000',
        categoryId: 'cat8',
      },
      {
        id: '9',
        name: 'Crème Hydratante',
        price: '18000',
        description: 'Crème hydratante pour visage',
        category: 'Beauté',
        colors: ['Naturel'],
        sizes: ['50ml', '100ml'],
        stockQuantity: 0,
        images: ['https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-23T12:00:00Z',
        updatedAt: '2024-01-23T12:00:00Z',
        cost: '12000',
        categoryId: 'cat9',
      },
      {
        id: '10',
        name: 'Veste en Cuir',
        price: '65000',
        description: 'Veste en cuir véritable style motard',
        category: 'Vestes',
        colors: ['noir', 'marron'],
        sizes: ['S', 'M', 'L', 'XL'],
        stockQuantity: 7,
        images: ['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'],
        createdAt: '2024-01-24T10:30:00Z',
        updatedAt: '2024-01-24T10:30:00Z',
        cost: '48000',
        categoryId: 'cat10',
      }
    ];
  }

  static getMockCategories() {
    return [
      { id: 'cat1', name: 'Robes' },
      { id: 'cat2', name: 'Chemises' },
      { id: 'cat3', name: 'Pantalons' },
      { id: 'cat4', name: 'Chaussures' },
      { id: 'cat5', name: 'Accessoires' },
      { id: 'cat6', name: 'Bijoux' },
      { id: 'cat7', name: 'Électronique' },
      { id: 'cat8', name: 'Maison' },
      { id: 'cat9', name: 'Beauté' },
      { id: 'cat10', name: 'Vestes' },
    ];
  }

  static getMockSales(): Sale[] {
    return [
      {
        id: 'sale1',
        productId: '1',
        productName: 'Robe Élégante Rouge',
        quantity: 2,
        size: 'M',
        color: 'rouge',
        unitPrice: '25000',
        totalPrice: '50000',
        paymentMethod: 'cash',
        timestamp: '2024-01-25T14:30:00Z',
      },
      {
        id: 'sale2',
        productId: '2',
        productName: 'Chemise Blanche Classique',
        quantity: 1,
        size: 'L',
        color: 'blanc',
        unitPrice: '15000',
        totalPrice: '15000',
        paymentMethod: 'mobile-money',
        timestamp: '2024-01-25T15:45:00Z',
      },
      {
        id: 'sale3',
        productId: '4',
        productName: 'Chaussures Sport Noires',
        quantity: 1,
        size: '42',
        color: 'noir',
        unitPrice: '35000',
        totalPrice: '35000',
        paymentMethod: 'credit',
        timestamp: '2024-01-25T16:20:00Z',
      }
    ];
  }

  // Generate barcode for products
  static generateBarcode(productId: string): string {
    // Simple barcode generation based on product ID
    const baseCode = '123456';
    const productCode = productId.padStart(4, '0');
    return baseCode + productCode;
  }

  // Find product by barcode
  static findProductByBarcode(barcode: string): Product | null {
    const products = this.getMockProducts();
    
    // Extract product ID from barcode (last 4 digits)
    const productIdFromBarcode = parseInt(barcode.slice(-4)).toString();
    
    return products.find(product => product.id === productIdFromBarcode) || null;
  }
}