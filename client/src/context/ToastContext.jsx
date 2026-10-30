import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);
const ICON = { success: '✅', error: '⚠️', info: '💡' };

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const toast = useCallback((msg, type = 'info', ms = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l.slice(-2), { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), ms);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} className={`toast ${t.type}`} initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} layout>
              <span>{ICON[t.type]}</span> {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
