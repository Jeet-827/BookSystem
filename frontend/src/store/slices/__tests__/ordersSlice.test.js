import { describe, it, expect } from 'vitest';
import ordersReducer, {
  clearOrderState,
  clearOrderError,
  placeOrder,
  fetchUserOrders,
  requestOrderRefund,
} from '../ordersSlice';

describe('ordersSlice reducers and actions', () => {
  const initialOrderState = {
    orders: [],
    loading: false,
    placingOrder: false,
    error: null,
    lastPlacedOrder: null,
    paymentProcessing: false,
  };

  it('should return initial state when passed undefined', () => {
    expect(ordersReducer(undefined, { type: undefined })).toEqual(initialOrderState);
  });

  it('should clear order state and error', () => {
    const dirtyState = {
      ...initialOrderState,
      error: 'Some error occurred',
      lastPlacedOrder: { orderNumber: 'BM-123' },
    };

    const cleaned = ordersReducer(dirtyState, clearOrderState());
    expect(cleaned.error).toBeNull();
    expect(cleaned.lastPlacedOrder).toBeNull();
  });

  it('should handle placeOrder.pending', () => {
    const nextState = ordersReducer(initialOrderState, {
      type: placeOrder.pending.type,
    });
    expect(nextState.placingOrder).toBe(true);
    expect(nextState.paymentProcessing).toBe(true);
    expect(nextState.error).toBeNull();
  });

  it('should handle placeOrder.fulfilled with instant download order payload', () => {
    const mockOrder = {
      _id: 'ord-101',
      orderNumber: 'BM-XYZ-999',
      totalAmount: 499,
      paymentStatus: 'paid',
      orderStatus: 'completed',
      items: [
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          price: 299,
          fileFormat: 'EPUB',
          digitalFileKey: 'https://example.com/gatsby.epub',
        },
      ],
    };

    const nextState = ordersReducer(initialOrderState, {
      type: placeOrder.fulfilled.type,
      payload: mockOrder,
    });

    expect(nextState.placingOrder).toBe(false);
    expect(nextState.paymentProcessing).toBe(false);
    expect(nextState.lastPlacedOrder).toEqual(mockOrder);
    expect(nextState.orders).toHaveLength(1);
    expect(nextState.orders[0].orderNumber).toBe('BM-XYZ-999');
  });

  it('should handle requestOrderRefund.fulfilled', () => {
    const stateWithOrder = {
      ...initialOrderState,
      orders: [
        {
          _id: 'ord-101',
          orderNumber: 'BM-XYZ-999',
          totalAmount: 499,
          refundStatus: 'none',
        },
      ],
    };

    const updatedOrder = {
      _id: 'ord-101',
      orderNumber: 'BM-XYZ-999',
      totalAmount: 499,
      refundStatus: 'requested',
      refundReason: 'Changed mind',
    };

    const nextState = ordersReducer(stateWithOrder, {
      type: requestOrderRefund.fulfilled.type,
      payload: updatedOrder,
    });

    expect(nextState.orders[0].refundStatus).toBe('requested');
    expect(nextState.orders[0].refundReason).toBe('Changed mind');
  });
});
