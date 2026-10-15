import Head from 'expo-router/head';

/** The web version of `DocumentTitle`: the title goes in the document head. */
export function DocumentTitle({ title }: { title: string }) {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
}
