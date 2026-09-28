package com.feedback.controller;

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
            resp.getWriter().write("{\"message\": \"Course created\"}");
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
                resp.getWriter().write("{\"message\": \"Course deleted\"}");
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }
}
