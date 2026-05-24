import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart', { productId, quantity });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (productId, { rejectWithValue }) => {
  try {
    await api.delete(`/cart/${productId}`);
    return productId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove from cart');
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart');
    return null;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/coupon', { code });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalPrice: 0,
    coupon: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCartError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.cart?.items || [];
        state.totalPrice = action.payload.totalPrice || 0;
        state.coupon = action.payload.cart?.coupon || null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.cart?.items || [];
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.cart?.items || [];
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.product?._id !== action.payload);
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalPrice = 0;
        state.coupon = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.coupon = action.payload.coupon;
      });
  },
});

export const { clearCartError } = cartSlice.actions;
export const selectCartCount = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export default cartSlice.reducer;
