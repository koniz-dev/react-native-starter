import Head from 'expo-router/head';

/**
 * Sets the browser tab's title on the web; renders nothing on native.
 * Render it in a screen with the screen's own title.
 */
export function DocumentTitle({ title }: { title: string }) {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
}
