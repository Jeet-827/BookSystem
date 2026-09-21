import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import authReducer from '../../store/slices/authSlice';
import cartReducer from '../../store/slices/cartSlice';
import booksReducer from '../../store/slices/booksSlice';

const renderNavbar = (preloadedState = {}) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      books: booksReducer,
    },
    preloadedState,
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </Provider>
  );
};

describe('Navbar Component', () => {
  it('renders logo and navigation links', () => {
    renderNavbar();

    expect(screen.getByText('BookMart')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/search books, authors/i)[0]).toBeInTheDocument();
  });

  it('shows Login link when unauthenticated', () => {
    renderNavbar({
      auth: { isAuthenticated: false, user: null },
    });

    const loginLinks = screen.getAllByRole('link', { name: /login/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows user name when authenticated', () => {
    renderNavbar({
      auth: {
        isAuthenticated: true,
        user: { name: 'Alice Walker', email: 'alice@example.com' },
      },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows badge when cart has items', () => {
    renderNavbar({
      cart: {
        items: [
          { _id: '1', price: 300, originalPrice: 500, quantity: 2 },
          { _id: '2', price: 100, originalPrice: 200, quantity: 1 },
        ],
        orders: [],
        purchasedBooks: [],
      },
    });

    const badges = screen.getAllByText('3');
    expect(badges.length).toBeGreaterThanOrEqual(1);
    expect(badges[0]).toBeInTheDocument();
  });
});
