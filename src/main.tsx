import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@fontsource/heebo/100.css'
import '@fontsource/heebo/200.css'
import '@fontsource/heebo/300.css'
import '@fontsource/heebo/400.css'
import '@fontsource/heebo/500.css'
import '@fontsource/heebo/600.css'
import '@fontsource/heebo/700.css'
import '@fontsource/heebo/800.css'
import '@fontsource/heebo/900.css'
import '@fontsource/frank-ruhl-libre/300.css'
import '@fontsource/frank-ruhl-libre/400.css'
import '@fontsource/frank-ruhl-libre/500.css'
import '@fontsource/frank-ruhl-libre/600.css'
import '@fontsource/frank-ruhl-libre/700.css'
import '@fontsource/frank-ruhl-libre/800.css'
import '@fontsource/frank-ruhl-libre/900.css'
import '@fontsource/david-libre/400.css'
import '@fontsource/david-libre/500.css'
import '@fontsource/david-libre/700.css'
import '@fontsource/varela-round/400.css'
import '@fontsource/amatic-sc/400.css'
import '@fontsource/amatic-sc/700.css'
import '@fontsource/assistant/200.css'
import '@fontsource/assistant/300.css'
import '@fontsource/assistant/400.css'
import '@fontsource/assistant/500.css'
import '@fontsource/assistant/600.css'
import '@fontsource/assistant/700.css'
import '@fontsource/assistant/800.css'
import '@fontsource/rubik/300.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/600.css'
import '@fontsource/rubik/700.css'
import '@fontsource/rubik/800.css'
import '@fontsource/rubik/900.css'
import '@fontsource/ibm-plex-sans-hebrew/100.css'
import '@fontsource/ibm-plex-sans-hebrew/200.css'
import '@fontsource/ibm-plex-sans-hebrew/300.css'
import '@fontsource/ibm-plex-sans-hebrew/400.css'
import '@fontsource/ibm-plex-sans-hebrew/500.css'
import '@fontsource/ibm-plex-sans-hebrew/600.css'
import '@fontsource/ibm-plex-sans-hebrew/700.css'
import '@fontsource/alef/400.css'
import '@fontsource/alef/700.css'
import '@fontsource/miriam-libre/400.css'
import '@fontsource/miriam-libre/500.css'
import '@fontsource/miriam-libre/600.css'
import '@fontsource/miriam-libre/700.css'
import '@fontsource/fredoka/300.css'
import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import '@fontsource/secular-one/400.css'
import '@fontsource/noto-serif-hebrew/100.css'
import '@fontsource/noto-serif-hebrew/200.css'
import '@fontsource/noto-serif-hebrew/300.css'
import '@fontsource/noto-serif-hebrew/400.css'
import '@fontsource/noto-serif-hebrew/500.css'
import '@fontsource/noto-serif-hebrew/600.css'
import '@fontsource/noto-serif-hebrew/700.css'
import '@fontsource/noto-serif-hebrew/800.css'
import '@fontsource/noto-serif-hebrew/900.css'
import '@fontsource/bellefair/400.css'
import '@fontsource/suez-one/400.css'
import '@fontsource/playpen-sans-hebrew/100.css'
import '@fontsource/playpen-sans-hebrew/200.css'
import '@fontsource/playpen-sans-hebrew/300.css'
import '@fontsource/playpen-sans-hebrew/400.css'
import '@fontsource/playpen-sans-hebrew/500.css'
import '@fontsource/playpen-sans-hebrew/600.css'
import '@fontsource/playpen-sans-hebrew/700.css'
import '@fontsource/playpen-sans-hebrew/800.css'
import '@fontsource/karantina/300.css'
import '@fontsource/karantina/400.css'
import '@fontsource/karantina/700.css'
import './styles.css'
import { I18nProvider } from './i18n'
import { StoreProvider } from './store'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Chooser } from './pages/Chooser'
import { Credits } from './pages/Credits'
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
      { path: '/credits', element: <Credits /> },
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
