import React, { useState, useEffect } from "react";
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Drawer,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import { logout, getUserFromToken } from "../services/authService";

const NavBar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Check for a logged-in user when the component mounts.
    useEffect(() => {
        const currentUser = getUserFromToken();
        setUser(currentUser);
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Handle logout: clear token, update state, and redirect.
    const handleLogout = () => {
        logout();
        setUser(null);
        navigate("/login");
    };

    // Define your nav items.
    const navItems = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Kanban", path: "/kanban" },
        { label: "Wiki", path: "/wiki" },
        { label: "Debug", path: "/debug" },
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
                        {navItems.map((item) => (
                            <Button
                                key={item.label}
                                color="inherit"
                                component={Link}
                                to={item.path}
                                sx={{ ml: 1 }}
                            >
                                {item.label}
                            </Button>
                        ))}
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

            {/* Mobile Drawer Navigation */}
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{
                    "& .MuiDrawer-paper": { width: 240 },
                }}
            >
                <List>
                    {navItems.map((item) => (
                        <ListItem
                            button
                            key={item.label}
                            component={Link}
                            to={item.path}
                            onClick={handleDrawerToggle}
                        >
                            <ListItemText primary={item.label} />
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
