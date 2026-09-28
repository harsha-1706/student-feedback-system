package com.feedback.controller;

import com.feedback.dao.UserDAO;
import com.feedback.model.User;
import com.feedback.util.PasswordUtil;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {
    private UserDAO userDAO = new UserDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        try {
            List<User> users = userDAO.findAll();
            users.forEach(u -> u.setPasswordHash(null)); // Hide password hash
            resp.setContentType("application/json");
            resp.getWriter().write(gson.toJson(users));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        JsonObject requestBody = gson.fromJson(req.getReader(), JsonObject.class);
        User user = new User();
        user.setUsername(requestBody.get("username").getAsString());
        user.setPasswordHash(PasswordUtil.hashPassword(requestBody.get("password").getAsString()));
        user.setRole(requestBody.get("role").getAsString());
        user.setName(requestBody.get("name").getAsString());
        user.setActive(true);
        try {
            userDAO.insertUser(user);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write("{\"message\": \"User created\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.endsWith("/deactivate")) {
            int id = Integer.parseInt(pathInfo.split("/")[1]);
            try {
                userDAO.setStatus(id, false);
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write("{\"message\": \"User deactivated\"}");
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
