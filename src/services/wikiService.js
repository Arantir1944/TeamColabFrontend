import axios from "axios";
import { getToken } from "./authService";

const API_URL = "16.170.210.30:5000/api/wiki";

export const fetchCategories = async () => {
    const token = getToken();
    const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: token }
    });
    return response.data.categories;
};

export const fetchArticlesByCategory = async (categoryId) => {
    const token = getToken();
    const response = await axios.get(`${API_URL}/articles/${categoryId}`, {
        headers: { Authorization: token }
    });
    return response.data.articles;
};

export const createCategory = async (name) => {
    const token = getToken();
    const response = await axios.post(
        `${API_URL}/category/create`,
        { name },
        { headers: { Authorization: token } }
    );
    return response.data.category;
};

export const createArticle = async (data) => {
    // data should include: title, content, categoryId
    const token = getToken();
    const response = await axios.post(
        `${API_URL}/article/create`,
        data,
        { headers: { Authorization: token } }
    );
    return response.data.article;
};
