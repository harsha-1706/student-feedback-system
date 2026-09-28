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

@WebServlet("/api/auth/login")
public class AuthServlet extends HttpServlet {
    private UserDAO userDAO = new UserDAO();
    private Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        JsonObject requestBody = gson.fromJson(req.getReader(), JsonObject.class);
        String username = requestBody.get("username").getAsString();
        String password = requestBody.get("password").getAsString();

        try {
            User user = userDAO.findByUsername(username);
            if (user == null || !PasswordUtil.checkPassword(password, user.getPasswordHash())) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.getWriter().write("{\"message\": \"Invalid credentials\"}");
                return;
            }

            if (!user.isActive()) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                resp.getWriter().write("{\"message\": \"Account is deactivated\"}");
                return;
            }

            // Experiment 8 - HttpSession
            HttpSession session = req.getSession(true);
            session.setAttribute("userId", user.getId());
            session.setAttribute("userRole", user.getRole());
            session.setAttribute("username", user.getUsername());

            JsonObject responseData = new JsonObject();
            JsonObject userObj = new JsonObject();
            userObj.addProperty("id", user.getId());
            userObj.addProperty("username", user.getUsername());
            userObj.addProperty("role", user.getRole());
            userObj.addProperty("name", user.getName());
            responseData.add("user", userObj);

            resp.setContentType("application/json");
            resp.getWriter().write(gson.toJson(responseData));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"message\": \"Server error\"}");
        }
    }
}
