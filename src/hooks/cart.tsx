import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
  updateCounter: number;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [updateCounter, setUpdateCounter] = useState(0);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      let items = await AsyncStorage.getItem('@GoMarketplace:products');

      if (items) {
        items = JSON.parse(items);
        setProducts(items || []);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      products[productIndex].quantity++;

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );

      setUpdateCounter(updateCounter + 1);
    },
    [products, updateCounter],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (products[productIndex].quantity > 1) {
        products[productIndex].quantity--;
      } else {
        setProducts(products.filter(product => product.id !== id));
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );

      setUpdateCounter(updateCounter + 1);
    },
    [products, updateCounter],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(
        currProduct => currProduct.id === product.id,
      );

      let items = null;

      if (productIndex >= 0) {
        if (!product.quantity) product.quantity = 0;

        increment(product.id);

        items = products;
      } else {
        items = await AsyncStorage.getItem('@GoMarketplace:products');

        if (items) {
          items = JSON.parse(items);
        } else {
          items = [];
        }
        // initialize quantity
        product.quantity = 1;
        items.push(product);

        setProducts([...products, product]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(items),
      );

      setUpdateCounter(updateCounter + 1);
    },
    [products, increment, updateCounter],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products, updateCounter }),
    [products, addToCart, increment, decrement, updateCounter],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
