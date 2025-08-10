import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { AccountLayout } from '@/layouts/AccountLayout';
import WeatherDashboard from '@/components/WeatherDashboard';

const Weather = ({ session }) => {
  return (
    <AccountLayout session={session}>
      <WeatherDashboard />
    </AccountLayout>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};

export default Weather;
