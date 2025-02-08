import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import NavBar from "@/components/nav-bar";
import ArticleCard from "@/components/article-card";
import Footer from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState("trending");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles", { limit, offset: (page - 1) * limit }],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="most-cited">Most Cited</TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : (
              articles?.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
