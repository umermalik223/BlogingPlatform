const express = require('express');
const router = express.Router();

// Utility function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleString('en-US', options);
}

// Route for Reader Home Page
router.get('/home', (req, res) => {
    global.db.get('SELECT blog_title, author_name FROM settings', (err, settings) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        const query = 'SELECT * FROM articles WHERE published_at IS NOT NULL ORDER BY published_at DESC';
        global.db.all(query, (err, publishedArticles) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            res.render('reader-home-page', {
                blogTitle: settings.blog_title,
                authorName: settings.author_name,
                publishedArticles: publishedArticles,
                formatDate: formatDate
            });
        });
    });
});

// Route for Reading an Article
router.get('/article/:id', (req, res) => {
    const articleId = req.params.id;
    const sort = req.query.sort || 'newest';

    const sortOrder = sort === 'oldest' ? 'ASC' : 'DESC';

    const articleQuery = 'SELECT * FROM articles WHERE article_id = ?';
    const commentsQuery = `SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ${sortOrder}`;

    global.db.get(articleQuery, [articleId], (err, article) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        if (!article) {
            return res.status(404).send('Article not found');
        }

        global.db.all(commentsQuery, [articleId], (err, comments) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            const reactionsQuery = 'SELECT reaction_type, count FROM reactions WHERE article_id = ?';
                global.db.all(reactionsQuery, [articleId], (err, reactions) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Transform reactions array into an object for easier access in the template
                    const reactionsMap = reactions.reduce((acc, reaction) => {
                        acc[reaction.reaction_type] = reaction.count;
                        return acc;
                    }, {})

                res.render('reader-article-page', {
                    article: article,
                    comments: comments,
                    reactions: reactionsMap,
                    formatDate: formatDate
                });
            });
        });
    });
});

// Route to handle liking an article
router.post('/like-article/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    const query = 'UPDATE articles SET likes = likes + 1 WHERE article_id = ?';
    global.db.run(query, [articleId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to like the article');
        }
        res.redirect(`/reader/article/${articleId}`);
    });
});

// Route to handle adding a comment
router.post('/comment/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    const { name, comment } = req.body;
    const query = 'INSERT INTO comments (article_id, name, comment, created_at) VALUES (?, ?, ?, ?)';
    const createdAt = new Date().toISOString();
    global.db.run(query, [articleId, name, comment, createdAt], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to add comment');
        }
        res.redirect(`/reader/article/${articleId}`);
    });
});

// Route to handle adding a reaction
router.post('/react/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    const { reactionType } = req.body;

    const query = 'UPDATE reactions SET count = count + 1 WHERE article_id = ? AND reaction_type = ?';
    global.db.run(query, [articleId, reactionType], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to add reaction');
        }
        res.redirect(`/reader/article/${articleId}`);
    });
});

module.exports = router;
