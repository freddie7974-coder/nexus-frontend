import React from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useApp()

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/store" replace />

  return children
}
