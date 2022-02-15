import type { NextPage } from 'next';
import Image from 'next/image';

import useFetchData from '../components/common/hooks/useFetchData';
import profilePic from '../../public/vercel.svg';

const Home: NextPage = () => {
  const { data, loading, error } = useFetchData('api/template-url');
  return (
    <div>
      <Image src={profilePic} alt="Picture of the author" />
      <div className="cur-h">loading: {loading?.toString()}</div>
      <div>data: {JSON.stringify(data)}</div>
      <div>error: {error?.toString()}</div>
    </div>
  );
};

export default Home;
