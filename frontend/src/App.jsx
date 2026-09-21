import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthSession } from './store/slices/authSlice';

// Core UI Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MoonLoader from './components/MoonLoader';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy Loaded Page Components (Code-Splitting for optimal performance)
const Home = lazy(() => import('./pages/Home'));
const Books = lazy(() => import('./pages/Books'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Fallback Loading Component
const PageSuspenseFallback = () => (
  <div className="flex-1 min-h-[65vh] flex items-center justify-center">
    <MoonLoader size={48} color="#000000" text="Loading..." />
  </div>
);

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check session from secure HTTP-only cookies on startup
    dispatch(checkAuthSession());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<PageSuspenseFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route
                path="*"
                element={
                  <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
                    <h2 className="text-2xl font-extrabold text-gray-900 font-display">
                      404 - Page Not Found
                    </h2>
                    <p className="text-xs text-gray-500">
                      The page you are looking for does not exist.
                    </p>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
