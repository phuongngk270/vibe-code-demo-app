import '../styles/globals.css';
import '../styles/acl.css';
import type { AppProps } from 'next/app';
import { AppShell } from '../components/ui/AppShell';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppShell>
      <Component {...pageProps} />
    </AppShell>
  );
}

export default MyApp;
