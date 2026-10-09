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

// Create order on backend with payment
export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async ({ items, paymentMethod, paymentDetails, couponCode }, { rejectWithValue }) => {
    try {
      const payload = {
        items: items.map((item) => ({
          bookId: item._id || item.book,
          quantity: item.quantity || 1,
        })),
        paymentMethod,
        paymentDetails,
        couponCode: couponCode || '',
      };
      const res = await api.post('/orders', payload);
      return res.data.order;
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
      return res.data.order;
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
  },
  reducers: {
    clearOrderState: (state) => {
      state.error = null;
      state.lastPlacedOrder = null;
    },
    clearOrderError: (state) => {
      state.error = null;
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

      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.placingOrder = true;
        state.paymentProcessing = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.paymentProcessing = false;
        state.lastPlacedOrder = action.payload;
        state.orders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placingOrder = false;
        state.paymentProcessing = false;
        state.error = action.payload;
      })

      // Request Refund
      .addCase(requestOrderRefund.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o._id === action.payload._id);
        if (idx !== -1) {
          state.orders[idx] = action.payload;
        }
      })
      .addCase(requestOrderRefund.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearOrderState, clearOrderError } = ordersSlice.actions;
export default ordersSlice.reducer;
