import { Link } from "wouter";
import { Article } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, Eye, Clock } from "lucide-react";

interface ArticleCardProps {
  article: Article & {
    author?: {
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
    };
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/article/${article.slug}`}>
        <a className="block">
          {article.coverImage && (
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-48 object-cover"
            />
          )}

          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={article.author?.avatarUrl ?? undefined} />
                <AvatarFallback>{article.author?.name?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{article.author?.name ?? 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(article.createdAt)}
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">{article.title}</h3>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{article.category}</Badge>
              {article.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>

          <CardFooter className="px-6 py-4 bg-muted/50 flex justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.viewCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {article.likeCount ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                0
              </span>
            </div>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              5 min read
            </span>
          </CardFooter>
        </a>
      </Link>
    </Card>
  );
}