const express = require('express');
const router = express.Router();

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleString('en-US', options);
}

// Route for Author Home Page
router.get('/home', (req, res) => {
    global.db.get('SELECT blog_title, author_name FROM settings', (err, settings) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        global.db.all('SELECT * FROM articles WHERE published_at IS NOT NULL', (err, publishedArticles) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            global.db.all('SELECT * FROM articles WHERE published_at IS NULL', (err, draftArticles) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                res.render('author-home-page', {
                    blogTitle: settings.blog_title,
                    authorName: settings.author_name,
                    publishedArticles: publishedArticles,
                    draftArticles: draftArticles
                });
            });
        });
    });
});

// Route for Editing an Article
router.get('/edit-article/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    global.db.get('SELECT * FROM articles WHERE article_id = ?', [articleId], (err, article) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        if (!article) {
            return res.status(404).send('Article not found');
        }
        res.render('edit-article', { article });
    });
});

// Route for Updating an Article
router.post('/edit-article/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    const { title, content } = req.body;

    global.db.run('UPDATE articles SET title = ?, content = ?, last_modified = CURRENT_TIMESTAMP WHERE article_id = ?', [title, content, articleId], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to update article');
        }
        res.redirect('/author/home');
    });
});

// Route for Author Settings Page
router.get('/update-settings', (req, res) => {
    global.db.get('SELECT blog_title, author_name FROM settings', (err, currentSettings) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('author-settings-page', { currentSettings });
    });
});

// Route for Updating Author Settings
router.post('/update-settings', (req, res) => {
    const { blogTitle, authorName } = req.body;

    global.db.run('UPDATE settings SET blog_title = ?, author_name = ?', [blogTitle, authorName], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to update settings');
        }
        res.redirect('/author/home');
    });
});

// Route for Creating a Draft Article
router.post('/create-draft', (req, res) => {
    const newArticle = {
        title: 'New Draft Article',
        content: 'Content of the new draft article',
        published_at: null,
        reads: 0,
        likes: 0,
        user_id: 1
    };

    const query = `
        INSERT INTO articles (title, content, published_at, reads, likes, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        newArticle.title,
        newArticle.content,
        newArticle.published_at,
        newArticle.reads,
        newArticle.likes,
        newArticle.user_id
    ];

    global.db.run(query, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to create new draft article');
        }
        const newArticleId = this.lastID;
        res.redirect(`/author/edit-article/${newArticleId}`);
    });
});

// Route for Publishing an Article
router.post('/publish-article/:article_id', (req, res) => {
    const articleId = req.params.article_id;

    global.db.run('UPDATE articles SET published_at = CURRENT_TIMESTAMP WHERE article_id = ?', [articleId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send(`Failed to publish article ${articleId}`);
        }
        res.redirect('/author/home');
    });
});

// Route for Deleting an Article
router.post('/delete-article/:article_id', (req, res) => {
    const articleId = req.params.article_id;

    global.db.run('DELETE FROM articles WHERE article_id = ?', [articleId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send(`Failed to delete article ${articleId}`);
        }
        res.redirect('/author/home');
    });
});

router.get('/moderate-comments', (req, res) => {
    // Fetch the author name from settings
    global.db.get('SELECT author_name FROM settings', (err, settings) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Determine the sorting order based on query parameter
        const sort = req.query.sort || 'newest';
        let orderByClause;

        if (sort === 'newest') {
            orderByClause = 'ORDER BY created_at DESC';
        } else if (sort === 'oldest') {
            orderByClause = 'ORDER BY created_at ASC';
        } else {
            orderByClause = 'ORDER BY created_at DESC'; // Default to newest
        }

        // Fetch pending comments with the specified sorting order
        const query = `SELECT * FROM comments WHERE status = "pending" ${orderByClause}`;
        global.db.all(query, (err, comments) => {
            if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
                return;
            }

            res.render('moderate-comments', {
                comments: comments,
                authorName: settings.author_name,
                formatDate: formatDate
            });
        });
    });
});


router.post('/moderate-comments/approve/:commentId', (req, res) => {
    const commentId = req.params.commentId;
    const query = 'UPDATE comments SET status = "approved" WHERE comment_id = ?';
    global.db.run(query, [commentId], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Failed to approve comment');
            return;
        }
        res.redirect('/author/moderate-comments');
    });
});

// Route to reject a comment
router.post('/moderate-comments/reject/:commentId', (req, res) => {
    const commentId = req.params.commentId;
    const query = 'UPDATE comments SET status = "rejected" WHERE comment_id = ?';
    global.db.run(query, [commentId], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Failed to reject comment');
            return;
        }
        res.redirect('/author/moderate-comments');
    });
});

module.exports = router;
