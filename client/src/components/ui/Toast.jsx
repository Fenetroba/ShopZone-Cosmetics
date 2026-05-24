import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../../redux/slices/uiSlice';

const icons = {
  success: <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />,
  error:   <XCircle    className="h-5 w-5 text-danger  flex-shrink-0" />,
  warning: <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />,
  info:    <Info        className="h-5 w-5 text-info    flex-shrink-0" />,
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dispatch]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="flex items-start gap-3 bg-bg-subtle border border-border rounded-xl shadow-lg p-4 min-w-72 max-w-sm"
    >
      {icons[toast.type] || icons.info}
      <div className="flex-1 min-w-0">
        {toast.title   && <p className="text-sm font-semibold text-text">{toast.title}</p>}
        {toast.message && <p className="text-sm text-text-muted">{toast.message}</p>}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-text-subtle hover:text-text flex-shrink-0 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
