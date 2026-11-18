import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Checkout from '../Checkout';
import AdminOrders from '../../components/admin/AdminOrders';
import cartReducer from '../../store/slices/cartSlice';
import ordersReducer, { placeOrder } from '../../store/slices/ordersSlice';
import authReducer from '../../store/slices/authSlice';
import api from '../../api/api';

vi.mock('../../api/api');

const renderWithProviders = (
  ui,
  {
    initialCartState = {},
    initialAuthState = {},
    initialOrdersState = {},
  } = {}
) => {
  const store = configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
      orders: ordersReducer,
    },
    preloadedState: {
      auth: {
        user: { id: 'u1', name: 'Ritul Baldha', email: 'ritulbaldha9@gmail.com' },
        isAuthenticated: true,
        loading: false,
        error: null,
        sessionChecking: false,
        ...initialAuthState,
      },
      cart: {
        items: [
          {
            _id: 'book_1',
            title: 'Mastering Fullstack React & Node.js',
            author: 'Ritul Baldha',
            price: 499,
            quantity: 1,
            fileFormat: 'PDF',
            fileSize: '5.4 MB',
          },
        ],
        ...initialCartState,
      },
      orders: {
        orders: [],
        loading: false,
        placingOrder: false,
        error: null,
        lastPlacedOrder: null,
        ...initialOrdersState,
      },
    },
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
};

describe('Features: User Login for Payment & Admin Collected Payments Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. should show verified account banner when user is logged in on Checkout', () => {
    renderWithProviders(<Checkout />, {
      initialAuthState: {
        isAuthenticated: true,
        user: { name: 'Jeet Patel', email: 'jeet@gmail.com' },
      },
    });

    expect(screen.getByText(/Logged In: Jeet Patel/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Account/i)).toBeInTheDocument();
  });

  it('2. should show login requirement notice and login button when user is unauthenticated', () => {
    renderWithProviders(<Checkout />, {
      initialAuthState: {
        isAuthenticated: false,
        user: null,
      },
    });

    expect(screen.getByText(/Login Required for Payment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In to Pay/i })).toBeInTheDocument();
  });

  it('3. should ensure placeOrder payload includes fallback cardNumber to prevent 400 Invalid card number', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      data: {
        success: true,
        order: {
          _id: 'ord_123',
          totalAmount: 499,
          paymentStatus: 'paid',
        },
      },
    });

    const mockAxios = (await import('../../api/axios')).default;
    vi.spyOn(mockAxios, 'post').mockImplementation(mockPost);

    const store = configureStore({
      reducer: { orders: ordersReducer },
    });

    await store.dispatch(
      placeOrder({
        items: [{ _id: 'book_1', quantity: 1 }],
        paymentMethod: 'razorpay',
        paymentDetails: {
          gateway: 'Razorpay',
          razorpay_payment_id: 'pay_test_123',
        },
      })
    );

    expect(mockPost).toHaveBeenCalled();
    const calledPayload = mockPost.mock.calls[0][1];
    expect(calledPayload.paymentDetails).toBeDefined();
    expect(calledPayload.paymentDetails.cardNumber).toBe('4111111111111111');
    expect(calledPayload.paymentDetails.gateway).toBe('Razorpay');
  });

  it('4. should render AdminOrders with Collected Payments tab and lifetime revenue card', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        orders: [
          {
            _id: 'ord_1',
            orderNumber: 'BM-170000-1111',
            invoiceNumber: 'INV-2026-9991',
            totalAmount: 1499,
            paymentStatus: 'paid',
            orderStatus: 'completed',
            paymentMethod: 'razorpay',
            paymentDetails: { razorpayPaymentId: 'pay_rzp_test_101' },
            user: { name: 'Alice Smith', email: 'alice@example.com' },
            items: [{ title: 'Fullstack Mastery', price: 1499, fileFormat: 'PDF' }],
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        pages: 1,
        metrics: {
          totalCollectedAmount: 1499,
          paidCount: 1,
          totalOrders: 1,
        },
      },
    });

    render(
      <BrowserRouter>
        <AdminOrders initialView="payments" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Collected Payments/i)).toBeInTheDocument();
      expect(screen.getAllByText(/₹1,499/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/pay_rzp_test_101/i)).toBeInTheDocument();
    });
  });

  it('5. should open payment receipt breakdown modal when receipt button is clicked', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        orders: [
          {
            _id: 'ord_2',
            orderNumber: 'BM-2026-2222',
            invoiceNumber: 'INV-2026-8882',
            totalAmount: 899,
            paymentStatus: 'paid',
            orderStatus: 'completed',
            paymentMethod: 'razorpay',
            paymentDetails: { razorpayPaymentId: 'pay_live_999888' },
            user: { name: 'Bob Johnson', email: 'bob@gmail.com' },
            items: [{ title: 'Node.js Microservices', price: 899, fileFormat: 'EPUB' }],
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        pages: 1,
        metrics: {
          totalCollectedAmount: 899,
          paidCount: 1,
          totalOrders: 1,
        },
      },
    });

    render(
      <BrowserRouter>
        <AdminOrders initialView="payments" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/pay_live_999888/i)).toBeInTheDocument();
    });

    const receiptBtn = screen.getByRole('button', { name: /Receipt/i });
    fireEvent.click(receiptBtn);

    expect(screen.getByText(/Payment Receipt & Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Captured & Settled/i)).toBeInTheDocument();
    expect(screen.getAllByText(/bob@gmail.com/i).length).toBeGreaterThan(0);
  });
});
