import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '../components/Header';
import { UserProvider } from '../context/UserContext';
import { TripProvider } from '../context/TripContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <TripProvider>
        <Header />
        <Component {...pageProps} />
      </TripProvider>
    </UserProvider>
  );
}
