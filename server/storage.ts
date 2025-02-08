import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import {
  users,
  articles,
  comments,
  likes,
  bookmarks,
  type User,
  type InsertUser,
  type Article,
  type InsertArticle,
  type Comment,
  type InsertComment,
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Article operations
  createArticle(article: InsertArticle & { authorId: number }): Promise<Article>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article>;
  listArticles(options: { limit: number; offset: number }): Promise<Article[]>;
  searchArticles(query: string): Promise<Article[]>;

  // Comment operations
  createComment(comment: InsertComment & { authorId: number }): Promise<Comment>;
  getArticleComments(articleId: number): Promise<Comment[]>;

  // Social operations
  likeArticle(userId: number, articleId: number): Promise<void>;
  unlikeArticle(userId: number, articleId: number): Promise<void>;
  bookmarkArticle(userId: number, articleId: number): Promise<void>;
  unbookmarkArticle(userId: number, articleId: number): Promise<void>;
  getUserBookmarks(userId: number): Promise<Article[]>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createArticle(article: InsertArticle & { authorId: number }): Promise<Article> {
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const [newArticle] = await db
      .insert(articles)
      .values({ ...article, slug })
      .returning();
    return newArticle;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        excerpt: articles.excerpt,
        authorId: articles.authorId,
        published: articles.published,
        viewCount: articles.viewCount,
        likeCount: articles.likeCount,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: articles.category,
        tags: articles.tags,
        coverImage: articles.coverImage,
        author: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.slug, slug));
    return article;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article> {
    const [updated] = await db
      .update(articles)
      .set(article)
      .where(eq(articles.id, id))
      .returning();
    return updated;
  }

  async listArticles({ limit, offset }: { limit: number; offset: number }): Promise<Article[]> {
    return db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        excerpt: articles.excerpt,
        authorId: articles.authorId,
        published: articles.published,
        viewCount: articles.viewCount,
        likeCount: articles.likeCount,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: articles.category,
        tags: articles.tags,
        coverImage: articles.coverImage,
        author: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchArticles(query: string): Promise<Article[]> {
    return db
      .select()
      .from(articles)
      .where(eq(articles.title, query))
      .limit(10);
  }

  async createComment(comment: InsertComment & { authorId: number }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getArticleComments(articleId: number): Promise<Comment[]> {
    return db
      .select({
        id: comments.id,
        content: comments.content,
        authorId: comments.authorId,
        articleId: comments.articleId,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.articleId, articleId))
      .orderBy(desc(comments.createdAt));
  }

  async likeArticle(userId: number, articleId: number): Promise<void> {
    await db.insert(likes).values({ userId, articleId });
    await db.execute(
      sql`UPDATE articles SET like_count = like_count + 1 WHERE id = ${articleId}`
    );
  }

  async unlikeArticle(userId: number, articleId: number): Promise<void> {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.articleId, articleId)
        )
      );
    await db.execute(
      sql`UPDATE articles SET like_count = like_count - 1 WHERE id = ${articleId}`
    );
  }

  async bookmarkArticle(userId: number, articleId: number): Promise<void> {
    await db.insert(bookmarks).values({ userId, articleId });
  }

  async unbookmarkArticle(userId: number, articleId: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.articleId, articleId)
        )
      );
  }

  async getUserBookmarks(userId: number): Promise<Article[]> {
    const bookmarkedArticles = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .innerJoin(articles, eq(bookmarks.articleId, articles.id));

    return bookmarkedArticles.map(({ articles: article }) => article);
  }
}

export const storage = new DatabaseStorage();