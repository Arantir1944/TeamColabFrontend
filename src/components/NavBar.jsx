// src/components/NavBar.jsx
import React, { useContext, useState, useEffect } from "react";
import {
    AppBar, Box, Toolbar,
    IconButton, Typography,
    Button, Drawer,
    List, ListItem, ListItemText,
    Badge
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";      // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import socket from "../utils/socket";
import { getConversations } from "../services/chatService";

const NavBar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);

    // On mount: load convos, join each room
    useEffect(() => {
        getConversations().then(convos => {
            convos.forEach(c => socket.emit("joinConversation", c.id));
        });
        const handler = msg => {
            if (location.pathname !== "/chat") {
                setUnreadCount(c => c + 1);
            }
        };
        socket.on("newMessage", handler);
        return () => { socket.off("newMessage", handler); };
    }, [location.pathname]);

    // Reset badge when entering /chat
    useEffect(() => {
        if (location.pathname === "/chat") {
            setUnreadCount(0);
        }
    }, [location.pathname]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Kanban", path: "/kanban" },
        { label: "Wiki", path: "/wiki" },
        { label: "Chat", path: "/chat" },
        { label: "Debug", path: "/debug" }
    ];

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ display: { sm: "none" } }}
                        onClick={handleDrawerToggle}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        color="inherit"
                        sx={{ textDecoration: "none", flexGrow: 1 }}
                    >
                        Team Colab
                    </Typography>

                    {/* Desktop navigation */}
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        {navItems.map(item => {
                            if (item.path === "/chat") {
                                return (
                                    <Badge
                                        key="chat-badge"
                                        badgeContent={unreadCount}
                                        color="error"
                                        invisible={unreadCount === 0}
                                    >
                                        <Button
                                            color="inherit"
                                            component={Link}
                                            to="/chat"
                                            sx={{ ml: 1 }}
                                        >
                                            Chat
                                        </Button>
                                    </Badge>
                                );
                            }
                            return (
                                <Button
                                    key={item.label}
                                    color="inherit"
                                    component={Link}
                                    to={item.path}
                                    sx={{ ml: 1 }}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}

                        {user ? (
                            <Button
                                color="secondary"
                                variant="contained"
                                sx={{ ml: 2 }}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        ) : (
                            <Button
                                color="secondary"
                                variant="contained"
                                sx={{ ml: 2 }}
                                component={Link}
                                to="/login"
                            >
                                Login
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{ "& .MuiDrawer-paper": { width: 240 } }}
            >
                <List>
                    {navItems.map(item => (
                        <ListItem
                            button
                            key={item.label}
                            component={Link}
                            to={item.path}
                            onClick={handleDrawerToggle}
                        >
                            {item.path === "/chat" ? (
                                <Badge
                                    badgeContent={unreadCount}
                                    color="error"
                                    invisible={unreadCount === 0}
                                >
                                    <ListItemText primary="Chat" />
                                </Badge>
                            ) : (
                                <ListItemText primary={item.label} />
                            )}
                        </ListItem>
                    ))}
                    {user ? (
                        <ListItem
                            button
                            onClick={() => {
                                handleLogout();
                                handleDrawerToggle();
                            }}
                        >
                            <ListItemText primary="Logout" />
                        </ListItem>
                    ) : (
                        <ListItem
                            button
                            component={Link}
                            to="/login"
                            onClick={handleDrawerToggle}
                        >
                            <ListItemText primary="Login" />
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </>
    );
};

export default NavBar;
