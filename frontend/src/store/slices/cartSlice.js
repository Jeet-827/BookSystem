import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const book = action.payload;
      const existing = state.items.find((item) => item._id === book._id);

      if (existing) {
        if (existing.quantity < (book.stock || 99)) {
          existing.quantity += 1;
        }
      } else {
        state.items.push({
          _id: book._id,
          title: book.title,
          author: book.author,
          price: book.price,
          originalPrice: book.originalPrice || book.price,
          image: book.image,
          category: book.category,
          stock: book.stock || 10,
          downloadUrl:
            book.downloadUrl ||
            'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileFormat: book.fileFormat || 'PDF',
          fileSize: book.fileSize || '4.5 MB',
          quantity: 1,
        });
      }
    },

    removeFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item) => item._id !== id);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i._id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i._id !== id);
        } else {
          item.quantity = Math.min(quantity, item.stock || 99);
        }
      }
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.originalPrice * item.quantity, 0);
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartDiscount = (state) =>
  selectCartSubtotal(state) - selectCartTotal(state);

export default cartSlice.reducer;
