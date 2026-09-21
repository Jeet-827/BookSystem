import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import BookCard from '../BookCard';
import cartReducer from '../../store/slices/cartSlice';

const renderWithStore = (component, { preloadedState } = {}) => {
  const store = configureStore({
    reducer: { cart: cartReducer },
    preloadedState,
  });

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>{component}</MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('BookCard Component', () => {
  const mockBook = {
    _id: 'b123',
    title: 'Atomic Habits',
    author: 'James Clear',
    price: 449,
    originalPrice: 699,
    category: 'Self-Help',
    rating: 4.9,
    reviewCount: 8921,
    isBestseller: true,
    downloadUrl: 'https://example.com/sample.pdf',
    fileFormat: 'PDF',
    stock: 25,
  };

  it('renders book details accurately', () => {
    renderWithStore(<BookCard book={mockBook} />);

    expect(screen.getByText('Atomic Habits')).toBeInTheDocument();
    expect(screen.getByText(/by James Clear/i)).toBeInTheDocument();
    expect(screen.getByText('Self-Help')).toBeInTheDocument();
    expect(screen.getByText('₹449')).toBeInTheDocument();
    expect(screen.getByText('₹699')).toBeInTheDocument();
    expect(screen.getByText('Bestseller')).toBeInTheDocument();
    expect(screen.getByText(/36% OFF/i)).toBeInTheDocument();
  });

  it('dispatches addToCart when Add to Cart button is clicked', () => {
    const { store } = renderWithStore(<BookCard book={mockBook} />);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    const state = store.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0]._id).toBe('b123');
    expect(state.cart.items[0].quantity).toBe(1);
  });
});
