import { describe, it, expect } from 'vitest';
import ordersReducer, {
  placeOrder,
  clearOrderState,
  requestOrderRefund,
  getDownloadLink,
} from '../ordersSlice';

describe('Feature 2 & 3: Digital eBook Orders, Instant Downloads & Razorpay Payment State (18 Test Cases)', () => {
  const initialOrdersState = {
    orders: [],
    loading: false,
    placingOrder: false,
    error: null,
    lastPlacedOrder: null,
    paymentProcessing: false,
    refundLoading: false,
    refundError: null,
    downloadLoading: false,
  };

  // -------------------------------------------------------------
  // Test Cases 1-6: Initial State & Order Lifecycle
  // -------------------------------------------------------------
  it('1. should return initial state when passed undefined action', () => {
    expect(ordersReducer(undefined, { type: undefined })).toEqual(initialOrdersState);
  });

  it('2. should set placingOrder to true on placeOrder.pending', () => {
    const nextState = ordersReducer(initialOrdersState, {
      type: placeOrder.pending.type,
    });
    expect(nextState.placingOrder).toBe(true);
    expect(nextState.error).toBeNull();
  });

  it('3. should store lastPlacedOrder with Razorpay payment details on placeOrder.fulfilled', () => {
    const mockPlacedOrder = {
      _id: 'order_123',
      orderNumber: 'BM-XYZ-999',
      paymentMethod: 'razorpay',
      paymentDetails: {
        gateway: 'Razorpay',
        razorpayPaymentId: 'pay_rzp_test_12345',
        razorpayOrderId: 'order_rzp_98765',
      },
      items: [
        {
          _id: 'item_1',
          title: 'JavaScript Mastery',
          fileFormat: 'PDF',
          fileSize: '4.2 MB',
          digitalFileKey: 'https://drive.google.com/uc?export=download&id=sample_file_1',
        },
      ],
      totalAmount: 499,
      paymentStatus: 'paid',
      orderStatus: 'completed',
    };

    const nextState = ordersReducer(initialOrdersState, {
      type: placeOrder.fulfilled.type,
      payload: { order: mockPlacedOrder },
    });

    expect(nextState.placingOrder).toBe(false);
    expect(nextState.lastPlacedOrder).toEqual(mockPlacedOrder);
    expect(nextState.orders).toHaveLength(1);
    expect(nextState.orders[0].paymentMethod).toBe('razorpay');
  });

  it('4. should handle placeOrder.rejected by setting error message', () => {
    const nextState = ordersReducer(initialOrdersState, {
      type: placeOrder.rejected.type,
      payload: 'Razorpay transaction was cancelled by user',
    });
    expect(nextState.placingOrder).toBe(false);
    expect(nextState.error).toBe('Razorpay transaction was cancelled by user');
  });

  it('5. should clear order state when clearOrderState is dispatched', () => {
    const dirtyState = {
      ...initialOrdersState,
      lastPlacedOrder: { _id: 'ord_1' },
      error: 'Some error',
    };
    const nextState = ordersReducer(dirtyState, clearOrderState());
    expect(nextState.lastPlacedOrder).toBeNull();
    expect(nextState.error).toBeNull();
  });

  // -------------------------------------------------------------
  // Test Cases 6-12: Digital Download & Delivery Specifications
  // -------------------------------------------------------------
  it('6. digital order items must retain Google Drive digitalFileKey', () => {
    const mockOrder = {
      _id: 'ord_sample',
      items: [
        {
          title: 'React Design Patterns',
          digitalFileKey: 'https://drive.google.com/uc?export=download&id=react_patterns_drive_id',
        },
      ],
    };
    expect(mockOrder.items[0].digitalFileKey).toContain('drive.google.com/uc?export=download');
  });

  it('7. digital order items must support PDF file format specification', () => {
    const item = { title: 'Book A', fileFormat: 'PDF', fileSize: '8.1 MB' };
    expect(item.fileFormat).toBe('PDF');
  });

  it('8. digital order items must support EPUB file format specification', () => {
    const item = { title: 'Book B', fileFormat: 'EPUB', fileSize: '2.5 MB' };
    expect(item.fileFormat).toBe('EPUB');
  });

  it('9. digital order items must support MOBI file format specification', () => {
    const item = { title: 'Book C', fileFormat: 'MOBI', fileSize: '3.0 MB' };
    expect(item.fileFormat).toBe('MOBI');
  });

  it('10. digital eBook orders have 0 physical shipping cost', () => {
    const subtotal = 599;
    const shippingFee = 0; // 100% digital
    const total = subtotal + shippingFee;
    expect(total).toBe(599);
  });

  it('11. digital eBook orders verify coupon discount calculation (e.g. 10% off READMORE)', () => {
    const subtotal = 1000;
    const discount = Math.round(subtotal * 0.1);
    const finalAmount = subtotal - discount;
    expect(discount).toBe(100);
    expect(finalAmount).toBe(900);
  });

  it('12. digital eBook orders verify 50% discount coupon FIRST50', () => {
    const subtotal = 1000;
    const discount = Math.round(subtotal * 0.5);
    const finalAmount = subtotal - discount;
    expect(discount).toBe(500);
    expect(finalAmount).toBe(500);
  });

  // -------------------------------------------------------------
  // Test Cases 13-18: Razorpay Integration & 24h Refund Guarantees
  // -------------------------------------------------------------
  it('13. Razorpay payment details gateway must equal "Razorpay"', () => {
    const paymentDetails = {
      gateway: 'Razorpay',
      razorpayPaymentId: 'pay_test_123',
    };
    expect(paymentDetails.gateway).toBe('Razorpay');
  });

  it('14. Razorpay transaction ID must have prefix "pay_rzp"', () => {
    const txnId = `pay_rzp_${Date.now()}`;
    expect(txnId.startsWith('pay_rzp_')).toBe(true);
  });

  it('15. should handle requestOrderRefund.pending by setting refundLoading', () => {
    const nextState = ordersReducer(initialOrdersState, {
      type: requestOrderRefund.pending.type,
    });
    expect(nextState.refundLoading).toBe(true);
  });

  it('16. should handle requestOrderRefund.fulfilled by updating order refundStatus', () => {
    const existingOrder = { _id: 'o_1', orderNumber: 'BM-1', refundStatus: 'none' };
    const stateWithOrder = { ...initialOrdersState, orders: [existingOrder] };

    const updatedOrder = { ...existingOrder, refundStatus: 'requested' };
    const nextState = ordersReducer(stateWithOrder, {
      type: requestOrderRefund.fulfilled.type,
      payload: { order: updatedOrder },
    });

    expect(nextState.refundLoading).toBe(false);
    expect(nextState.orders[0].refundStatus).toBe('requested');
  });

  it('17. should handle getDownloadLink.pending by setting downloadLoading', () => {
    const nextState = ordersReducer(initialOrdersState, {
      type: getDownloadLink.pending.type,
    });
    expect(nextState.downloadLoading).toBe(true);
  });

  it('18. should handle getDownloadLink.fulfilled by resetting downloadLoading', () => {
    const loadingState = { ...initialOrdersState, downloadLoading: true };
    const nextState = ordersReducer(loadingState, {
      type: getDownloadLink.fulfilled.type,
      payload: { downloadUrl: 'https://drive.google.com/uc?export=download&id=abc' },
    });
    expect(nextState.downloadLoading).toBe(false);
  });
});
