import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/wishlist');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/wishlist/${productId}`);
    return { productId, action: data.action };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    products: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.products = action.payload.wishlist?.products || [];
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { productId, action: act } = action.payload;
        if (act === 'removed') {
          state.products = state.products.filter((p) => {
            const id = typeof p === 'string' ? p : p._id;
            return id !== productId;
          });
        } else {
          state.products.push(productId);
        }
      });
  },
});

export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.products.some((p) => {
    const id = typeof p === 'string' ? p : p._id;
    return id === productId;
  });

export default wishlistSlice.reducer;
