import { NextPage } from 'next';
import Head from 'next/head';

// For static export path
export async function getStaticProps() {
  return {
    props: {},
  };
}

const ServerError: NextPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Head>
        <title>500 - Server Error</title>
      </Head>
      <h1>500 - Server Error</h1>
      <p>An unexpected error occurred on the server.</p>
      <p>
        <a href="/api/server" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Try accessing the MCP Server
        </a>
      </p>
    </div>
  );
};

export default ServerError;
