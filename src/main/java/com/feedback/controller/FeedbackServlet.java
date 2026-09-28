package com.feedback.controller;

import com.feedback.util.DBConnection;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/feedback/*")
public class FeedbackServlet extends HttpServlet {
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        Integer userId = (Integer) req.getAttribute("userId");
        String role = (String) req.getAttribute("userRole");

        try (Connection conn = DBConnection.getConnection()) {
            if ("/pending".equals(pathInfo) && "student".equals(role)) {
                String sql = "SELECT c.id as course_id, c.course_code, c.course_name, u.id as faculty_id, u.name as faculty_name " +
                             "FROM enrollments e " +
                             "JOIN courses c ON e.course_id = c.id " +
                             "JOIN faculty_courses fc ON c.id = fc.course_id " +
                             "JOIN users u ON fc.faculty_id = u.id " +
                             "LEFT JOIN feedback_submissions fs ON fs.student_id = e.student_id " +
                             "  AND fs.course_id = c.id AND fs.faculty_id = u.id " +
                             "WHERE e.student_id = ? AND fs.student_id IS NULL";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setInt(1, userId);
                    ResultSet rs = stmt.executeQuery();
                    List<JsonObject> list = new ArrayList<>();
                    while (rs.next()) {
                        JsonObject obj = new JsonObject();
                        obj.addProperty("course_id", rs.getInt("course_id"));
                        obj.addProperty("course_code", rs.getString("course_code"));
                        obj.addProperty("course_name", rs.getString("course_name"));
                        obj.addProperty("faculty_id", rs.getInt("faculty_id"));
                        obj.addProperty("faculty_name", rs.getString("faculty_name"));
                        list.add(obj);
                    }
                    resp.setContentType("application/json");
                    resp.getWriter().write(gson.toJson(list));
                }
            } else if ("/comments".equals(pathInfo) && !"student".equals(role)) {
                String sql = "SELECT comments, overall_rating FROM feedback";
                if ("faculty".equals(role)) {
                    sql += " WHERE faculty_id = ?";
                }
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    if ("faculty".equals(role)) {
                        stmt.setInt(1, userId);
                    }
                    ResultSet rs = stmt.executeQuery();
                    List<JsonObject> list = new ArrayList<>();
                    while(rs.next()) {
                        JsonObject obj = new JsonObject();
                        obj.addProperty("comments", rs.getString("comments"));
                        obj.addProperty("overall_rating", rs.getInt("overall_rating"));
                        list.add(obj);
                    }
                    resp.setContentType("application/json");
                    resp.getWriter().write(gson.toJson(list));
                }
            } else if ("/stats".equals(pathInfo)) {
                String sql = "SELECT AVG(teaching_rating) as avg_teaching, AVG(communication_rating) as avg_communication, " +
                             "AVG(overall_rating) as avg_overall, COUNT(*) as total_responses " +
                             "FROM feedback";
                if ("faculty".equals(role)) {
                    sql += " WHERE faculty_id = ?";
                }
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    if ("faculty".equals(role)) {
                        stmt.setInt(1, userId);
                    }
                    ResultSet rs = stmt.executeQuery();
                    if (rs.next()) {
                        JsonObject obj = new JsonObject();
                        obj.addProperty("teaching", rs.getDouble("avg_teaching"));
                        obj.addProperty("communication", rs.getDouble("avg_communication"));
                        obj.addProperty("overall", rs.getDouble("avg_overall"));
                        obj.addProperty("total_responses", rs.getInt("total_responses"));
                        resp.setContentType("application/json");
                        resp.getWriter().write(gson.toJson(obj));
                    }
                }
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        if ("/submit".equals(pathInfo)) {
            Integer studentId = (Integer) req.getAttribute("userId");
            JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
            
            int courseId = body.get("course_id").getAsInt();
            int facultyId = body.get("faculty_id").getAsInt();
            int tRating = body.get("teaching_rating").getAsInt();
            int cRating = body.get("communication_rating").getAsInt();
            int oRating = body.get("overall_rating").getAsInt();
            String comments = body.has("comments") ? body.get("comments").getAsString() : "";

            try (Connection conn = DBConnection.getConnection()) {
                conn.setAutoCommit(false);
                try {
                    // Check duplicate
                    String checkSql = "SELECT 1 FROM feedback_submissions WHERE student_id=? AND course_id=? AND faculty_id=? FOR UPDATE";
                    try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                        checkStmt.setInt(1, studentId);
                        checkStmt.setInt(2, courseId);
                        checkStmt.setInt(3, facultyId);
                        ResultSet rs = checkStmt.executeQuery();
                        if (rs.next()) {
                            resp.setStatus(HttpServletResponse.SC_CONFLICT);
                            resp.getWriter().write("{\"message\": \"Feedback already submitted\"}");
                            conn.rollback();
                            return;
                        }
                    }

                    // Insert feedback
                    String fbSql = "INSERT INTO feedback (course_id, faculty_id, teaching_rating, communication_rating, overall_rating, comments) VALUES (?, ?, ?, ?, ?, ?)";
                    try (PreparedStatement fbStmt = conn.prepareStatement(fbSql)) {
                        fbStmt.setInt(1, courseId);
                        fbStmt.setInt(2, facultyId);
                        fbStmt.setInt(3, tRating);
                        fbStmt.setInt(4, cRating);
                        fbStmt.setInt(5, oRating);
                        fbStmt.setString(6, comments);
                        fbStmt.executeUpdate();
                    }

                    // Insert tracking
                    String trackSql = "INSERT INTO feedback_submissions (student_id, course_id, faculty_id) VALUES (?, ?, ?)";
                    try (PreparedStatement trackStmt = conn.prepareStatement(trackSql)) {
                        trackStmt.setInt(1, studentId);
                        trackStmt.setInt(2, courseId);
                        trackStmt.setInt(3, facultyId);
                        trackStmt.executeUpdate();
                    }

                    conn.commit();
                    resp.setStatus(HttpServletResponse.SC_CREATED);
                    resp.getWriter().write("{\"message\": \"Feedback submitted successfully\"}");
                } catch (Exception e) {
                    conn.rollback();
                    throw e;
                }
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
