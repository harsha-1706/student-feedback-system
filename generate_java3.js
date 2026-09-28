const fs = require('fs');
const path = require('path');

const basePath = 'e:/Projects/Student Feedback System/src/main/java/com/feedback';

const files = {
    'controller/CourseServlet.java': `package com.feedback.controller;

import com.feedback.dao.CourseDAO;
import com.feedback.model.Course;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/courses/*")
public class CourseServlet extends HttpServlet {
    private CourseDAO courseDAO = new CourseDAO();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            List<Course> courses = courseDAO.findAll();
            resp.setContentType("application/json");
            resp.getWriter().write(gson.toJson(courses));
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
        Course course = new Course();
        course.setCourseCode(requestBody.get("course_code").getAsString());
        course.setCourseName(requestBody.get("course_name").getAsString());
        try {
            courseDAO.insertCourse(course);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write("{\\"message\\": \\"Course created\\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String role = (String) req.getAttribute("userRole");
        if (!"admin".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.length() > 1) {
            int id = Integer.parseInt(pathInfo.substring(1));
            try {
                courseDAO.deleteCourse(id);
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write("{\\"message\\": \\"Course deleted\\"}");
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
`,
    'controller/AssignmentServlet.java': `package com.feedback.controller;

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
                    resp.getWriter().write("{\\"message\\": \\"Assigned\\"}");
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
                    resp.getWriter().write("{\\"message\\": \\"Enrolled\\"}");
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
                        resp.getWriter().write("{\\"message\\": \\"Unassigned\\"}");
                    }
                } else if (parts[1].equals("student")) {
                    String sql = "DELETE FROM enrollments WHERE student_id=? AND course_id=?";
                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setInt(1, uId);
                        stmt.setInt(2, cId);
                        stmt.executeUpdate();
                        resp.setStatus(HttpServletResponse.SC_OK);
                        resp.getWriter().write("{\\"message\\": \\"Unenrolled\\"}");
                    }
                }
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
`
};

for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(basePath, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}
console.log("Servlets generated.");
