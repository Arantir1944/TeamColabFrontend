import React, { useState, useEffect } from "react";

import {
    Container,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Button,
    TextField,
    Box
} from "@mui/material";
import {
    fetchCategories,
    fetchArticlesByCategory,
    createCategory,
    createArticle
} from "../services/wikiService";
import { getUserFromToken } from "../services/authService";

export default function Wiki() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [articles, setArticles] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newArticleTitle, setNewArticleTitle] = useState("");
    const [newArticleContent, setNewArticleContent] = useState("");

    const user = getUserFromToken();

    // Load categories for the user's team
    const loadCategories = async () => {
        try {
            const cats = await fetchCategories();
            setCategories(cats);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    // Load articles for a given category
    const loadArticles = async (categoryId) => {
        try {
            const arts = await fetchArticlesByCategory(categoryId);
            setArticles(arts);
        } catch (error) {
            console.error("Error fetching articles:", error);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        loadArticles(category.id);
    };

    const handleAddCategory = async () => {
        if (newCategoryName.trim() === "") return;
        try {
            const category = await createCategory(newCategoryName);
            setCategories([...categories, category]);
            setNewCategoryName("");
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    const handleAddArticle = async () => {
        if (!selectedCategory || newArticleTitle.trim() === "" || newArticleContent.trim() === "") return;
        try {
            const article = await createArticle({
                title: newArticleTitle,
                content: newArticleContent,
                categoryId: selectedCategory.id
            });
            setArticles([...articles, article]);
            setNewArticleTitle("");
            setNewArticleContent("");
        } catch (error) {
            console.error("Error creating article:", error);
        }
    };

    return (
        <Container>
            <Typography variant="h3" gutterBottom>
                Wiki
            </Typography>
            <Box display="flex" justifyContent="space-between">
                {/* Left pane: Categories */}
                <Box width="30%">
                    <Typography variant="h5">Categories</Typography>
                    <List>
                        {categories.map((cat) => (
                            <ListItemButton
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                            >
                                <ListItemText primary={cat.name} />
                            </ListItemButton>
                        ))}
                    </List>
                    {(user.role === "Manager" || user.role === "Team Leader") && (
                        <Box mt={2}>
                            <TextField
                                label="New Category"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddCategory}
                                sx={{ mt: 1 }}
                            >
                                Add Category
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Right pane: Articles */}
                <Box width="65%">
                    <Typography variant="h5">
                        Articles {selectedCategory ? `in ${selectedCategory.name}` : ""}
                    </Typography>
                    {selectedCategory ? (
                        <>
                            <List>
                                {articles.map((article) => (
                                    <ListItem key={article.id}>
                                        <ListItemText
                                            primary={article.title}
                                            secondary={article.content}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            {(user.role === "Manager" || user.role === "Team Leader") && (
                                <Box mt={2}>
                                    <TextField
                                        label="Article Title"
                                        value={newArticleTitle}
                                        onChange={(e) => setNewArticleTitle(e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <TextField
                                        label="Article Content"
                                        value={newArticleContent}
                                        onChange={(e) => setNewArticleContent(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        margin="normal"
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddArticle}
                                    >
                                        Add Article
                                    </Button>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Typography variant="body1">
                            Select a category to view its articles.
                        </Typography>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
