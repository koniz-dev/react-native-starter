// features/posts/api/postsApi.ts
import { z } from 'zod';
import { api } from '@/shared/http/api';

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export type Post = z.infer<typeof PostSchema>;

/** `body` checked against `schema`; a mismatch throws a readable message. */
function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error('Unexpected response from the server', {
      cause: result.error,
    });
  }
  return result.data;
}

export const postsApi = {
  list: async (signal?: AbortSignal): Promise<Post[]> =>
    parse(z.array(PostSchema), (await api.get('/posts', { signal })).data),
  create: async (title: string): Promise<Post> =>
    parse(PostSchema, (await api.post('/posts', { title })).data),
};
