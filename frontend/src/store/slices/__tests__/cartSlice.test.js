import { describe, it, expect } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartCount,
  selectCartSubtotal,
  selectCartTotal,
  selectCartDiscount,
} from '../cartSlice';

const sampleBook = {
  _id: 'book-123',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  price: 500,
  originalPrice: 800,
  stock: 10,
  category: 'Technology',
  downloadUrl: 'https://example.com/clean-code.pdf',
  fileFormat: 'PDF',
  fileSize: '4.5 MB',
};

describe('cartSlice reducers and selectors', () => {
  const initialCartState = {
    items: [],
  };

  it('should return initial state when passed empty action', () => {
    expect(cartReducer(undefined, { type: undefined })).toEqual(initialCartState);
  });

  it('should add a book to the cart with default quantity of 1 and format properties', () => {
    const nextState = cartReducer(initialCartState, addToCart(sampleBook));
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0]._id).toBe('book-123');
    expect(nextState.items[0].quantity).toBe(1);
    expect(nextState.items[0].price).toBe(500);
    expect(nextState.items[0].fileFormat).toBe('PDF');
  });

  it('should increment quantity when adding an existing book', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const nextState = cartReducer(stateWithItem, addToCart(sampleBook));
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].quantity).toBe(2);
  });

  it('should update item quantity', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const nextState = cartReducer(
      stateWithItem,
      updateQuantity({ id: 'book-123', quantity: 5 })
    );
    expect(nextState.items[0].quantity).toBe(5);
  });

  it('should remove item when quantity is updated to 0 or negative', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const nextState = cartReducer(
      stateWithItem,
      updateQuantity({ id: 'book-123', quantity: 0 })
    );
    expect(nextState.items).toHaveLength(0);
  });

  it('should remove item by ID', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const nextState = cartReducer(stateWithItem, removeFromCart('book-123'));
    expect(nextState.items).toHaveLength(0);
  });

  it('should clear all items in cart', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const nextState = cartReducer(stateWithItem, clearCart());
    expect(nextState.items).toHaveLength(0);
  });

  it('should correctly calculate selectors for cartCount, subtotal, total, and discount', () => {
    const mockRootState = {
      cart: {
        items: [
          { _id: '1', price: 300, originalPrice: 500, quantity: 2 },
          { _id: '2', price: 200, originalPrice: 400, quantity: 1 },
        ],
      },
    };

    expect(selectCartCount(mockRootState)).toBe(3);
    expect(selectCartSubtotal(mockRootState)).toBe(1400); // (500*2) + (400*1)
    expect(selectCartTotal(mockRootState)).toBe(800); // (300*2) + (200*1)
    expect(selectCartDiscount(mockRootState)).toBe(600); // 1400 - 800
  });
});
