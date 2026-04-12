import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import AddMember from './pages/AddMember'
import MemberProfile from './pages/MemberProfile'
import EditMember from './pages/EditMember'
import BulkImport from './pages/BulkImport'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/add" element={<AddMember />} />
        <Route path="members/bulk-import" element={<BulkImport />} />
        <Route path="members/:id" element={<MemberProfile />} />
        <Route path="members/edit/:id" element={<EditMember />} />
      </Route>
    </Routes>
  )
}


export default App
