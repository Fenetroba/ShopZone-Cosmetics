import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../../redux/slices/authSlice';
import { fetchCart } from '../../redux/slices/cartSlice';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';
import { addToast } from '../../redux/slices/uiSlice';

// Google "G" SVG logo
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * GoogleButton — uses the credential-based flow (One Tap / popup).
 * Pass `onSuccess` callback if you need post-login side effects beyond Redux.
 */
export default function GoogleButton({ label = 'Continue with Google', redirectTo = '/' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { googleLoading } = useSelector((s) => s.auth);

  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await dispatch(googleLogin(credentialResponse.credential));

    if (googleLogin.fulfilled.match(result)) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      dispatch(addToast({ type: 'success', title: 'Signed in!', message: `Welcome, ${result.payload.user.name}` }));
      navigate(redirectTo, { replace: true });
    } else {
      dispatch(addToast({ type: 'error', message: result.payload || 'Google sign-in failed' }));
    }
  };

  const handleGoogleError = () => {
    dispatch(addToast({ type: 'error', message: 'Google sign-in was cancelled or failed. Please try again.' }));
  };

  // useGoogleLogin triggers a popup flow and returns a credential
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    flow: 'implicit',   // returns id_token directly
    ux_mode: 'popup',
  });

  return (
    <button
      type="button"
      onClick={() => triggerGoogleLogin()}
      disabled={googleLoading}
      className="
        w-full flex items-center justify-center gap-3
        h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800
        text-sm font-medium text-gray-700 dark:text-gray-200
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-colors shadow-sm
      "
    >
      {googleLoading ? (
        <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <GoogleIcon />
      )}
      <span>{googleLoading ? 'Signing in…' : label}</span>
    </button>
  );
}
