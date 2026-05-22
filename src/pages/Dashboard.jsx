import { Routes, Route } from 'react-router-dom'
import Layout            from '../components/Layout'
import Home              from './Home'
import Notes             from './Notes'
import Settings          from './Settings'
import Admin             from './Admin'

export default function Dashboard() {
  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Home />}     />
        <Route path="/notes"    element={<Notes />}    />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin"    element={<Admin />}    />
      </Routes>
    </Layout>
  )
}
