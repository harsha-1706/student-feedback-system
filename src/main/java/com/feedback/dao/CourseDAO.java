package com.feedback.dao;

import com.feedback.model.Course;
import com.feedback.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO {
    public List<Course> findAll() throws SQLException {
        String sql = "SELECT * FROM courses";
        List<Course> courses = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Course c = new Course();
                c.setId(rs.getInt("id"));
                c.setCourseCode(rs.getString("course_code"));
                c.setCourseName(rs.getString("course_name"));
                courses.add(c);
            }
        }
        return courses;
    }

    public List<Course> getPendingFeedbackCourses(int studentId) throws SQLException {
        String sql = "SELECT c.id, c.course_code, c.course_name, f.id AS faculty_id, u.name AS faculty_name " +
                     "FROM enrollments e " +
                     "JOIN courses c ON e.course_id = c.id " +
                     "JOIN faculty_courses fc ON c.id = fc.course_id " +
                     "JOIN users u ON fc.faculty_id = u.id " +
                     "LEFT JOIN feedback_submissions fs ON fs.student_id = e.student_id " +
                     "  AND fs.course_id = c.id AND fs.faculty_id = u.id " +
                     "WHERE e.student_id = ? AND fs.student_id IS NULL";
        List<Course> courses = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Course c = new Course();
                    c.setId(rs.getInt("id"));
                    c.setCourseCode(rs.getString("course_code"));
                    c.setCourseName(rs.getString("course_name"));
                    // We can reuse facultyName here for the faculty name output
                    c.setFacultyName(rs.getString("faculty_name"));
                    // Overloading facultyName slightly or creating a specific DTO would be cleaner,
                    // but we will send faculty_id and faculty_name as part of the JSON manually in servlet
                    courses.add(c);
                }
            }
        }
        return courses;
    }

    public void insertCourse(Course course) throws SQLException {
        String sql = "INSERT INTO courses (course_code, course_name) VALUES (?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, course.getCourseCode());
            stmt.setString(2, course.getCourseName());
            stmt.executeUpdate();
        }
    }

    public void deleteCourse(int id) throws SQLException {
        String sql = "DELETE FROM courses WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }
}
