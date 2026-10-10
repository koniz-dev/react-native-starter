// features/posts/screens/PostsScreen.tsx
import { Button, Text } from 'react-native-paper';
import { api } from '@/shared/http/api';
import { useFetch } from '@/shared/lib/useFetch';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

interface Post {
  id: number;
  title: string;
}

export function PostsScreen() {
  const { data, loading, error, refetch } = useFetch(
    async signal => (await api.get<Post[]>('/posts', { signal })).data
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
