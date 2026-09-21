import { describe, it, expect } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  placeOrder,
  requestRefund,
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
};

describe('cartSlice reducers and selectors', () => {
  const initialCartState = {
    items: [],
    orders: [],
    purchasedBooks: [],
  };

  it('should return initial state when passed empty action', () => {
    expect(cartReducer(undefined, { type: undefined })).toEqual(initialCartState);
  });

  it('should add a book to the cart with default quantity of 1', () => {
    const nextState = cartReducer(initialCartState, addToCart(sampleBook));
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0]._id).toBe('book-123');
    expect(nextState.items[0].quantity).toBe(1);
    expect(nextState.items[0].price).toBe(500);
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

  it('should place an order, clear cart, and append to purchasedBooks and orders', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const orderPayload = {
      items: stateWithItem.items,
      totalAmount: 500,
      deliveryCharge: 0,
    };
    const nextState = cartReducer(stateWithItem, placeOrder(orderPayload));
    expect(nextState.items).toHaveLength(0);
    expect(nextState.orders).toHaveLength(1);
    expect(nextState.orders[0].totalAmount).toBe(500);
    expect(nextState.purchasedBooks).toHaveLength(1);
  });

  it('should request 1-day instant refund and update order status', () => {
    const stateWithItem = cartReducer(initialCartState, addToCart(sampleBook));
    const orderPayload = {
      items: stateWithItem.items,
      totalAmount: 500,
      deliveryCharge: 0,
    };
    const orderedState = cartReducer(stateWithItem, placeOrder(orderPayload));
    const orderId = orderedState.orders[0].orderId;

    const refundedState = cartReducer(
      orderedState,
      requestRefund({ orderId, reason: 'Found a better price' })
    );

    const refundedOrder = refundedState.orders.find((o) => o.orderId === orderId);
    expect(refundedOrder.status).toContain('Refund Initiated');
    expect(refundedOrder.refundStatus.refundAmount).toBe(500);
    expect(refundedOrder.refundStatus.reason).toBe('Found a better price');
  });

  it('should correctly calculate selectors for cartCount, subtotal, total, and discount', () => {
    const mockRootState = {
      cart: {
        items: [
          { _id: '1', price: 300, originalPrice: 500, quantity: 2 },
          { _id: '2', price: 200, originalPrice: 400, quantity: 1 },
        ],
        orders: [],
        purchasedBooks: [],
      },
    };

    expect(selectCartCount(mockRootState)).toBe(3);
    expect(selectCartSubtotal(mockRootState)).toBe(1400); // (500*2) + (400*1)
    expect(selectCartTotal(mockRootState)).toBe(800); // (300*2) + (200*1)
    expect(selectCartDiscount(mockRootState)).toBe(600); // 1400 - 800
  });
});
