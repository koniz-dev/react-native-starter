// features/posts/screens/PostsScreen.tsx
import { Button, Text } from 'react-native-paper';
import { useFetch } from '@/shared/lib/useFetch';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

import { postsApi } from '../api/postsApi';

export function PostsScreen() {
  const { data, loading, error, refetch } = useFetch(signal =>
    postsApi.list(signal)
  );

  if (loading && !data) return <LoadingScreen message="Loading posts..." />;
  if (error)
    return <Button onPress={refetch}>{`${error.message}. Retry`}</Button>;
  return (
    <>
      {data?.map(post => (
        <Text key={post.id}>{post.title}</Text>
      ))}
    </>
  );
}
