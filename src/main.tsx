import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@fontsource/heebo/300.css'
import '@fontsource/heebo/400.css'
import '@fontsource/heebo/500.css'
import '@fontsource/heebo/700.css'
import '@fontsource/heebo/800.css'
import '@fontsource/frank-ruhl-libre/400.css'
import '@fontsource/david-libre/400.css'
import '@fontsource/varela-round/400.css'
import '@fontsource/amatic-sc/400.css'
import './styles.css'
import { I18nProvider } from './i18n'
import { StoreProvider } from './store'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Chooser } from './pages/Chooser'
import { Studio } from './pages/Studio'
import { Admin } from './pages/Admin'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/write', element: <Chooser /> },
      { path: '/write/:familyId', element: <Studio /> },
      { path: '/admin', element: <Admin /> },
      { path: '*', element: <Home /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </I18nProvider>
  </StrictMode>,
)
