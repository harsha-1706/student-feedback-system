package com.feedback.controller;

import com.feedback.util.DBConnection;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/api/assignments/*")
public class AssignmentServlet extends HttpServlet {
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        
        try (Connection conn = DBConnection.getConnection()) {
            if (pathInfo.startsWith("/faculty")) {
                String sql = "SELECT f.faculty_id, f.course_id, u.name as faculty_name, u.username, c.course_code, c.course_name " +
                             "FROM faculty_courses f " +
                             "JOIN users u ON f.faculty_id = u.id " +
                             "JOIN courses c ON f.course_id = c.id";
                try (PreparedStatement stmt = conn.prepareStatement(sql);
                     ResultSet rs = stmt.executeQuery()) {
                    JsonArray arr = new JsonArray();
                    while (rs.next()) {
                        JsonObject obj = new JsonObject();
                        obj.addProperty("faculty_id", rs.getInt("faculty_id"));
                        obj.addProperty("course_id", rs.getInt("course_id"));
                        obj.addProperty("faculty_name", rs.getString("faculty_name"));
                        obj.addProperty("course_code", rs.getString("course_code"));
                        obj.addProperty("course_name", rs.getString("course_name"));
                        arr.add(obj);
                    }
                    resp.setContentType("application/json");
                    resp.getWriter().write(gson.toJson(arr));
                }
            } else if (pathInfo.startsWith("/student")) {
                String sql = "SELECT e.student_id, e.course_id, u.name as student_name, u.username, c.course_code, c.course_name " +
                             "FROM enrollments e " +
                             "JOIN users u ON e.student_id = u.id " +
                             "JOIN courses c ON e.course_id = c.id";
                try (PreparedStatement stmt = conn.prepareStatement(sql);
                     ResultSet rs = stmt.executeQuery()) {
                    JsonArray arr = new JsonArray();
                    while (rs.next()) {
                        JsonObject obj = new JsonObject();
                        obj.addProperty("student_id", rs.getInt("student_id"));
                        obj.addProperty("course_id", rs.getInt("course_id"));
                        obj.addProperty("student_name", rs.getString("student_name"));
                        obj.addProperty("course_code", rs.getString("course_code"));
                        obj.addProperty("course_name", rs.getString("course_name"));
                        arr.add(obj);
                    }
                    resp.setContentType("application/json");
                    resp.getWriter().write(gson.toJson(arr));
                }
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        
        try (Connection conn = DBConnection.getConnection()) {
            if (pathInfo.startsWith("/faculty")) {
                int facultyId = body.get("faculty_id").getAsInt();
                int courseId = body.get("course_id").getAsInt();
                String sql = "INSERT INTO faculty_courses (faculty_id, course_id) VALUES (?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, facultyId);
                    stmt.setInt(2, courseId);
                    stmt.executeUpdate();
                    resp.setStatus(HttpServletResponse.SC_CREATED);
                    resp.getWriter().write("{\"message\": \"Assigned\"}");
                }
            } else if (pathInfo.startsWith("/student")) {
                int studentId = body.get("student_id").getAsInt();
                int courseId = body.get("course_id").getAsInt();
                String sql = "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, studentId);
                    stmt.setInt(2, courseId);
                    stmt.executeUpdate();
                    resp.setStatus(HttpServletResponse.SC_CREATED);
                    resp.getWriter().write("{\"message\": \"Enrolled\"}");
                }
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length >= 4) {
            int uId = Integer.parseInt(parts[2]);
            int cId = Integer.parseInt(parts[3]);
            try (Connection conn = DBConnection.getConnection()) {
                if (parts[1].equals("faculty")) {
                    String sql = "DELETE FROM faculty_courses WHERE faculty_id=? AND course_id=?";
                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setInt(1, uId);
                        stmt.setInt(2, cId);
                        stmt.executeUpdate();
                        resp.setStatus(HttpServletResponse.SC_OK);
                        resp.getWriter().write("{\"message\": \"Unassigned\"}");
                    }
                } else if (parts[1].equals("student")) {
                    String sql = "DELETE FROM enrollments WHERE student_id=? AND course_id=?";
                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setInt(1, uId);
                        stmt.setInt(2, cId);
                        stmt.executeUpdate();
                        resp.setStatus(HttpServletResponse.SC_OK);
                        resp.getWriter().write("{\"message\": \"Unenrolled\"}");
                    }
                }
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
