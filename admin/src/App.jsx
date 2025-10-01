import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import AccountManagement from './pages/AccountManagement'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FilterProvider } from './context/FilterContext';

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;

// Utility to safely join base URL and path without duplicate slashes
function joinUrl(base, path) {
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return base + path;
}

// Safely resolve backend base URL: use VITE_BACKEND_URL when provided, otherwise fallback to current origin
const resolvedBase = (typeof rawBackendUrl === 'string' && rawBackendUrl.length > 0)
  ? rawBackendUrl.replace(/\/$/, '')
  : window.location.origin;

export const backendUrl = {
  base: resolvedBase,
  join: (path) => joinUrl(resolvedBase, path)
};
export const currency = '₹'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');

  useEffect(()=>{
    localStorage.setItem('token',token)
  },[token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === ""
        ? <Routes>
            <Route path="/" element={<Login setToken={setToken} />} />
            <Route path="/reset-password" element={<ResetPassword setToken={setToken} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        : <FilterProvider token={token}>
            <Navbar setToken={setToken} />
            <hr />
            <div className='w-full'>
              <div className='w-[90%] mx-auto my-8 text-gray-600 text-base'>
                <Routes>
                  <Route path='/' element={<AccountManagement token={token} />} />
                  <Route path='*' element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </FilterProvider>
      }
    </div>
  )
}

export default App
