import React, { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const ICONS = {
  success: <CheckCircle className="text-green-400" />,
  warning: <AlertTriangle className="text-yellow-400" />,
  error: <XCircle className="text-red-400" />,
  info: <Info className="text-blue-400" />,
};

const Toast = ({ toast }) => {
  const { clearToast } = useGameStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Allow fade out animation to complete before clearing
        setTimeout(clearToast, 300);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  return (
    <AnimatePresence>
      {visible && toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          className="fixed top-5 right-5 z-[100]"
        >
          <div className="max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {ICONS[toast.type] || ICONS.info}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-100">{toast.title}</p>
                  <p className="mt-1 text-sm text-gray-400">{toast.message}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
