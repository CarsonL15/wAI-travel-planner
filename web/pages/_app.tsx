import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '../components/Header';
import { UserProvider } from '../context/UserContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Header />
      <Component {...pageProps} />
    </UserProvider>
  );
}
