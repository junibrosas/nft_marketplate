import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function App({ Component, pageProps }: AppProps) {
  // Create a navigation bar in tailwind css
  return <div>
    <Navbar />
    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 pt-8">
      <Component {...pageProps} />
    </div>
    <Footer />
  </div>
}
