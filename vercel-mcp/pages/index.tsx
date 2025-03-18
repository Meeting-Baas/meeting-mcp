import { NextPage } from 'next';
import Head from 'next/head';

// For static export path
export async function getStaticProps() {
  return {
    props: {},
  };
}

const Home: NextPage = () => {
  // Client-side redirect as fallback
  if (typeof window !== 'undefined') {
    window.location.href = '/api/server';
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Head>
        <title>Meeting BaaS MCP Server</title>
      </Head>
      <h1>Meeting BaaS MCP Server</h1>
      <p>Redirecting to MCP Server...</p>
      <p>
        <a href="/api/server" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Click here if you are not redirected automatically
        </a>
      </p>
    </div>
  );
};

export default Home;
