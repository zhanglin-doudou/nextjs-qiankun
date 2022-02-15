import type { NextPage } from 'next';
import useFetchData from '../../components/common/hooks/useFetchData';

const Dashboard: NextPage = () => {
  const { data, loading, error } = useFetchData('api/template-url');
  console.log('render dashboard');
  return (
    <div>
      <div>loading: {loading?.toString()}</div>
      <div>data: {JSON.stringify(data)}</div>
      <div>error: {error?.toString()}</div>
    </div>
  );
};

export default Dashboard;
