import '../../styles/index.scss';

import Header from '../components/common/layout/Header';
import MainView from '../components/common/layout/MainView';
import Nav from '../components/common/layout/Nav';

import type { AppProps } from 'next/app';
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header></Header>
      <div className="page-container">
        <Nav></Nav>
        <MainView>
          <Component {...pageProps} />
        </MainView>
      </div>
    </>
  );
}

export default MyApp;
