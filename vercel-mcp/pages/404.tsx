import { NextPage } from 'next';
import Head from 'next/head';

// For static export path
export async function getStaticProps() {
  return {
    props: {},
  };
}

const NotFound: NextPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>
        <a href="/api/server" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Go to MCP Server
        </a>
      </p>
    </div>
  );
};

export default NotFound;
