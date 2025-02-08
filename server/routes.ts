import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertArticleSchema, insertCommentSchema } from "@shared/schema";
import { createReadStream } from "fs";
import { join } from "path";
import archiver from "archiver";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Download source code route
  app.get("/api/download-source", (req, res) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('bangujournal-source.zip');
    archive.pipe(res);

    // Add source files to the archive
    archive.directory('client/src', 'client/src');
    archive.directory('server', 'server');
    archive.directory('shared', 'shared');

    // Add configuration files
    archive.file('package.json', { name: 'package.json' });
    archive.file('tsconfig.json', { name: 'tsconfig.json' });
    archive.file('vite.config.ts', { name: 'vite.config.ts' });

    archive.finalize();
  });

  // Article routes
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const articleData = insertArticleSchema.parse(req.body);
    const article = await storage.createArticle({
      ...articleData,
      authorId: req.user.id,
    });
    res.status(201).json(article);
  });

  app.get("/api/articles", async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const articles = await storage.listArticles({ limit, offset });
    res.json(articles);
  });

  app.get("/api/articles/search", async (req, res) => {
    const query = req.query.q as string;
    const articles = await storage.searchArticles(query);
    res.json(articles);
  });

  app.get("/api/articles/:slug", async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) return res.sendStatus(404);
    res.json(article);
  });

  // Comment routes
  app.post("/api/articles/:articleId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const commentData = insertCommentSchema.parse({
      ...req.body,
      articleId: Number(req.params.articleId),
    });

    const comment = await storage.createComment({
      ...commentData,
      authorId: req.user.id,
    });
    res.status(201).json(comment);
  });

  app.get("/api/articles/:articleId/comments", async (req, res) => {
    const comments = await storage.getArticleComments(Number(req.params.articleId));
    res.json(comments);
  });

  // Social routes
  app.post("/api/articles/:articleId/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.likeArticle(req.user.id, Number(req.params.articleId));
    res.sendStatus(200);
  });

  app.delete("/api/articles/:articleId/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.unlikeArticle(req.user.id, Number(req.params.articleId));
    res.sendStatus(200);
  });

  app.post("/api/articles/:articleId/bookmark", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.bookmarkArticle(req.user.id, Number(req.params.articleId));
    res.sendStatus(200);
  });

  app.delete("/api/articles/:articleId/bookmark", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.unbookmarkArticle(req.user.id, Number(req.params.articleId));
    res.sendStatus(200);
  });

  app.get("/api/user/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookmarks = await storage.getUserBookmarks(req.user.id);
    res.json(bookmarks);
  });

  const httpServer = createServer(app);
  return httpServer;
}