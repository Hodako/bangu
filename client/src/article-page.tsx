import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Article, Comment } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import NavBar from '@/components/nav-bar';
import Footer from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Bookmark,
  Calendar,
  Eye 
} from 'lucide-react';

interface ArticleWithAuthor extends Article {
  author?: {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface CommentWithAuthor extends Comment {
  author?: {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
}

export default function ArticlePage() {
  const { slug } = useParams();
  const { user } = useAuth();

  const { data: article, isLoading } = useQuery<ArticleWithAuthor>({
    queryKey: [`/api/articles/${slug}`],
  });

  const { data: comments } = useQuery<CommentWithAuthor[]>({
    queryKey: [`/api/articles/${article?.id}/comments`],
    enabled: !!article,
  });

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | BanguJournal`;

      const metaTags = [
        { name: 'description', content: article.excerpt },
        { name: 'og:title', content: article.title },
        { name: 'og:description', content: article.excerpt },
      ];

      if (article.coverImage) {
        metaTags.push({ name: 'og:image', content: article.coverImage });
      }

      const existingTags: HTMLMetaElement[] = [];

      metaTags.forEach(({ name, content }) => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
        existingTags.push(meta);
      });

      return () => {
        existingTags.forEach(tag => document.head.removeChild(tag));
      };
    }
  }, [article]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/4 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return <div>Article not found</div>;
  }

  const handleLike = async () => {
    await apiRequest('POST', `/api/articles/${article.id}/like`);
  };

  const handleBookmark = async () => {
    await apiRequest('POST', `/api/articles/${article.id}/bookmark`);
  };

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <header className="max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={article.author?.avatarUrl ?? undefined} />
                <AvatarFallback>{article.author?.name?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{article.author?.name ?? 'Anonymous'}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.createdAt)}
                  <Eye className="h-4 w-4 ml-2" />
                  {article.viewCount ?? 0} views
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleLike}>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {article.likeCount ?? 0}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleBookmark}>
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {article.coverImage && (
            <img 
              src={article.coverImage} 
              alt={article.title}
              className="w-full rounded-lg mb-8"
            />
          )}
        </header>

        <article className="prose prose-lg dark:prose-invert max-w-3xl mx-auto mb-12">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            Comments ({comments?.length || 0})
          </h2>

          <div className="space-y-4">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-card">
                <Avatar>
                  <AvatarImage src={comment.author?.avatarUrl ?? undefined} />
                  <AvatarFallback>{comment.author?.name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{comment.author?.name ?? 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </p>
                  <p className="mt-2">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}