import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import booksReducer from './slices/booksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    books: booksReducer,
  },
});

export default store;
