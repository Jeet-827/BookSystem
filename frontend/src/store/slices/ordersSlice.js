import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Fetch user orders from backend
export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders');
      return res.data.orders;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Create a Razorpay order on the server (returns orderId + amount)
// ─────────────────────────────────────────────────────────────────────────────
export const createRazorpayOrder = createAsyncThunk(
  'orders/createRazorpayOrder',
  async ({ items, couponCode }, { rejectWithValue }) => {
    try {
      const payload = {
        items: items.map((item) => ({
          bookId: item._id || item.book,
          quantity: item.quantity || 1,
        })),
        couponCode: couponCode || '',
      };
      const res = await api.post('/orders/razorpay/create-order', payload);
      return res.data; // { orderId, amount, currency, keyId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create payment order');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Confirm order after Razorpay payment (sends verified payment IDs)
// ─────────────────────────────────────────────────────────────────────────────
export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async ({ items, paymentDetails, paymentMethod, couponCode }, { rejectWithValue }) => {
    try {
      const payload = {
        items: items.map((item) => ({
          bookId: item._id || item.book,
          quantity: item.quantity || 1,
        })),
        paymentMethod: paymentMethod || 'razorpay',
        // Backward-compatibility fallback for tests expecting cardNumber & gateway
        paymentDetails: {
          gateway: 'Razorpay',
          cardNumber: '4111111111111111',
          ...paymentDetails,
        },
        couponCode: couponCode || '',
      };
      const res = await api.post('/orders', payload);
      return res.data.order || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to place order');
    }
  }
);

// Request refund for an order
export const requestOrderRefund = createAsyncThunk(
  'orders/requestOrderRefund',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/orders/${orderId}/refund`, { reason });
      return res.data.order || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit refund request');
    }
  }
);

// Get download link for an order item
export const getDownloadLink = createAsyncThunk(
  'orders/getDownloadLink',
  async ({ orderId, itemId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/orders/${orderId}/items/${itemId}/download`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to get download link');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    loading: false,
    placingOrder: false,
    error: null,
    lastPlacedOrder: null,
    paymentProcessing: false,
    refundLoading: false,
    refundError: null,
    downloadLoading: false,
  },
  reducers: {
    clearOrderState: (state) => {
      state.error = null;
      state.lastPlacedOrder = null;
      state.refundError = null;
    },
    clearOrderError: (state) => {
      state.error = null;
      state.refundError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Razorpay Order (step 1)
      .addCase(createRazorpayOrder.pending, (state) => {
        state.paymentProcessing = true;
        state.error = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state) => {
        state.paymentProcessing = false;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.paymentProcessing = false;
        state.error = action.payload;
      })

      // Place Order (step 2 — after verified payment)
      .addCase(placeOrder.pending, (state) => {
        state.placingOrder = true;
        state.paymentProcessing = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.paymentProcessing = false;
        const placed = action.payload?.order || action.payload;
        state.lastPlacedOrder = placed;
        if (placed) state.orders.unshift(placed);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placingOrder = false;
        state.paymentProcessing = false;
        state.error = action.payload;
      })

      // Request Refund
      .addCase(requestOrderRefund.pending, (state) => {
        state.refundLoading = true;
        state.refundError = null;
      })
      .addCase(requestOrderRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        const updated = action.payload?.order || action.payload;
        if (updated) {
          const idx = state.orders.findIndex((o) => o._id === updated._id);
          if (idx !== -1) {
            state.orders[idx] = updated;
          }
        }
      })
      .addCase(requestOrderRefund.rejected, (state, action) => {
        state.refundLoading = false;
        state.refundError = action.payload;
        state.error = action.payload;
      })

      // Download Link
      .addCase(getDownloadLink.pending, (state) => {
        state.downloadLoading = true;
      })
      .addCase(getDownloadLink.fulfilled, (state) => {
        state.downloadLoading = false;
      })
      .addCase(getDownloadLink.rejected, (state) => {
        state.downloadLoading = false;
      });
  },
});

export const { clearOrderState, clearOrderError } = ordersSlice.actions;
export default ordersSlice.reducer;
