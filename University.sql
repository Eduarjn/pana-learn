-- =============================================================
-- W06 Project: University Database
-- Part 1: Forward Engineer code (generated from the University ERD)
-- =============================================================

DROP SCHEMA IF EXISTS `university`;
CREATE SCHEMA IF NOT EXISTS `university` DEFAULT CHARACTER SET utf8mb4;
USE `university`;

-- -------------------------------------------------------------
-- Table `college`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `college` (
  `college_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(75) NOT NULL,
  PRIMARY KEY (`college_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `department`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `department` (
  `department_id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(75) NOT NULL,
  `college_id` INT NOT NULL,
  PRIMARY KEY (`department_id`),
  INDEX `fk_department_college_idx` (`college_id` ASC),
  CONSTRAINT `fk_department_college`
    FOREIGN KEY (`college_id`) REFERENCES `college` (`college_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `course`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course` (
  `course_id` INT NOT NULL AUTO_INCREMENT,
  `course_num` INT NOT NULL,
  `name` VARCHAR(75) NOT NULL,
  `credits` INT NOT NULL,
  `department_id` INT NOT NULL,
  PRIMARY KEY (`course_id`),
  INDEX `fk_course_department_idx` (`department_id` ASC),
  CONSTRAINT `fk_course_department`
    FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `faculty`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faculty` (
  `faculty_id` INT NOT NULL AUTO_INCREMENT,
  `fname` VARCHAR(45) NOT NULL,
  `lname` VARCHAR(45) NOT NULL,
  `department_id` INT NOT NULL,
  PRIMARY KEY (`faculty_id`),
  INDEX `fk_faculty_department_idx` (`department_id` ASC),
  CONSTRAINT `fk_faculty_department`
    FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `student`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student` (
  `student_id` INT NOT NULL AUTO_INCREMENT,
  `fname` VARCHAR(45) NOT NULL,
  `lname` VARCHAR(45) NOT NULL,
  `birthdate` DATE NOT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `term`
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `term` (
  `term_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(10) NOT NULL,
  `year` YEAR NOT NULL,
  PRIMARY KEY (`term_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `section` (central table: one instance of a course)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `section` (
  `section_id` INT NOT NULL AUTO_INCREMENT,
  `section_num` INT NOT NULL,
  `capacity` INT NOT NULL,
  `course_id` INT NOT NULL,
  `term_id` INT NOT NULL,
  `faculty_id` INT NOT NULL,
  PRIMARY KEY (`section_id`),
  INDEX `fk_section_course_idx` (`course_id` ASC),
  INDEX `fk_section_term_idx` (`term_id` ASC),
  INDEX `fk_section_faculty_idx` (`faculty_id` ASC),
  CONSTRAINT `fk_section_course`
    FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`),
  CONSTRAINT `fk_section_term`
    FOREIGN KEY (`term_id`) REFERENCES `term` (`term_id`),
  CONSTRAINT `fk_section_faculty`
    FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Table `enrollment` (student <-> section)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enrollment` (
  `student_id` INT NOT NULL,
  `section_id` INT NOT NULL,
  PRIMARY KEY (`student_id`, `section_id`),
  INDEX `fk_enrollment_section_idx` (`section_id` ASC),
  CONSTRAINT `fk_enrollment_student`
    FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`),
  CONSTRAINT `fk_enrollment_section`
    FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`)
) ENGINE = InnoDB;


-- =============================================================
-- Part 2: Insert statements (University Data)
-- =============================================================

INSERT INTO `college` (`college_id`, `name`) VALUES
  (1, 'College of Business and Communication'),
  (2, 'College of Language and Letters'),
  (3, 'Physical Science and Engineering');

INSERT INTO `department` (`department_id`, `code`, `name`, `college_id`) VALUES
  (1, 'ECON', 'Economics', 1),
  (2, 'HUM',  'Humanities and Philosophy', 2),
  (3, 'ITM',  'Information Technology and Business Analytics', 3);

INSERT INTO `course` (`course_id`, `course_num`, `name`, `credits`, `department_id`) VALUES
  (1, 150, 'Micro Economics',     3, 1),
  (2, 388, 'Econometrics',        4, 1),
  (3, 376, 'Classical Heritage',  2, 2),
  (4, 111, 'Intro to Databases',  3, 3);

INSERT INTO `faculty` (`faculty_id`, `fname`, `lname`, `department_id`) VALUES
  (1, 'Marty', 'Morring', 1),
  (2, 'John',  'Jensen',  3),
  (3, 'Bill',  'Barney',  1),
  (4, 'Nate',  'Norris',  2);

INSERT INTO `student` (`student_id`, `fname`, `lname`, `birthdate`) VALUES
  (1,  'Katie',   'Smith',    '1995-07-22'),
  (2,  'Paul',    'Miller',   '1996-02-22'),
  (3,  'Preston', 'Larsen',   '1996-09-22'),
  (4,  'Mandy',   'Murdock',  '1996-11-22'),
  (5,  'Alece',   'Adams',    '1997-05-22'),
  (6,  'Bryce',   'Carlson',  '1997-11-22'),
  (7,  'Kelly',   'Jones',    '1998-06-22'),
  (8,  'Susan',   'Sorensen', '1998-08-09'),
  (9,  'Julia',   'Madsen',   '1998-09-22'),
  (10, 'Devon',   'Merrill',  '2000-07-22');

INSERT INTO `term` (`term_id`, `name`, `year`) VALUES
  (1, 'Winter', 2018),
  (2, 'Fall',   2019);

-- Winter 2018 sections
INSERT INTO `section` (`section_id`, `section_num`, `capacity`, `course_id`, `term_id`, `faculty_id`) VALUES
  (1, 1, 30,  1, 1, 1),   -- ECON 150 Micro Economics    - Morring
  (2, 1, 30,  4, 1, 2),   -- ITM  111 Intro to Databases - Jensen
  (3, 1, 35,  2, 1, 3),   -- ECON 388 Econometrics       - Barney
  (4, 1, 100, 3, 1, 4),   -- HUM  376 Classical Heritage - Norris
-- Fall 2019 sections
  (5, 1, 35,  2, 2, 3),   -- ECON 388 Econometrics       - Barney
  (6, 1, 100, 3, 2, 4),   -- HUM  376 Classical Heritage - Norris
  (7, 1, 30,  4, 2, 1),   -- ITM  111 Intro to Databases - Morring
  (8, 1, 30,  1, 2, 1);   -- ECON 150 Micro Economics    - Morring

-- Winter 2018 enrollments
INSERT INTO `enrollment` (`student_id`, `section_id`) VALUES
  (6, 1), (6, 2), (6, 4),          -- Bryce Carlson: Micro Economics, Intro to Databases, Classical Heritage
  (10, 2), (4, 2),                 -- Devon Merrill, Mandy Murdock (Jensen's section)
  (3, 3), (8, 3),                  -- Preston Larsen, Susan Sorensen
  (5, 1), (7, 1),                  -- Alece Adams, Kelly Jones
  (9, 4), (1, 4), (2, 4),          -- Julia Madsen, Katie Smith, Paul Miller
-- Fall 2019 enrollments
  (7, 5), (4, 5), (1, 5),          -- Econometrics: Kelly Jones, Mandy Murdock, Katie Smith
  (4, 6),                          -- Classical Heritage: Mandy Murdock
  (2, 7), (5, 7),                  -- Intro to Databases: Paul Miller, Alece Adams
  (2, 8);                          -- Micro Economics: Paul Miller


-- =============================================================
-- Part 3: Queries
-- =============================================================

-- Query 1: Students, and their birthdays, of students born in September.
SELECT s.fname, s.lname,
       DATE_FORMAT(s.birthdate, '%M %e, %Y') AS 'Sept Birthdays'
FROM student AS s
WHERE MONTH(s.birthdate) = 9
ORDER BY s.lname;

-- Query 2: Student's age in years and days as of Jan. 5, 2017.
SELECT s.lname, s.fname,
       FLOOR(DATEDIFF('2017-01-05', s.birthdate) / 365) AS 'Years',
       DATEDIFF('2017-01-05', s.birthdate) % 365        AS 'Days',
       CONCAT(FLOOR(DATEDIFF('2017-01-05', s.birthdate) / 365), ' - Yrs, ',
              DATEDIFF('2017-01-05', s.birthdate) % 365, ' - Days') AS 'Years and Days'
FROM student AS s
ORDER BY s.birthdate;

-- Query 3: Students taught by John Jensen.
SELECT DISTINCT s.fname, s.lname
FROM student AS s
JOIN enrollment AS e ON s.student_id = e.student_id
JOIN section    AS sec ON e.section_id = sec.section_id
JOIN faculty    AS f ON sec.faculty_id = f.faculty_id
WHERE f.fname = 'John' AND f.lname = 'Jensen'
ORDER BY s.lname;

-- Query 4: Instructors Bryce will have in Winter 2018.
SELECT DISTINCT f.fname, f.lname
FROM faculty AS f
JOIN section    AS sec ON f.faculty_id = sec.faculty_id
JOIN term       AS t ON sec.term_id = t.term_id
JOIN enrollment AS e ON sec.section_id = e.section_id
JOIN student    AS s ON e.student_id = s.student_id
WHERE s.fname = 'Bryce' AND s.lname = 'Carlson'
  AND t.name = 'Winter' AND t.year = 2018
ORDER BY f.lname;

-- Query 5: Students that take Econometrics in Fall 2019.
SELECT s.fname, s.lname
FROM student AS s
JOIN enrollment AS e ON s.student_id = e.student_id
JOIN section    AS sec ON e.section_id = sec.section_id
JOIN course     AS c ON sec.course_id = c.course_id
JOIN term       AS t ON sec.term_id = t.term_id
WHERE c.name = 'Econometrics'
  AND t.name = 'Fall' AND t.year = 2019
ORDER BY s.lname;

-- Query 6: All of Bryce Carlson's courses for Winter 2018.
SELECT d.code AS 'department_code', c.course_num, c.name
FROM course AS c
JOIN department AS d ON c.department_id = d.department_id
JOIN section    AS sec ON c.course_id = sec.course_id
JOIN term       AS t ON sec.term_id = t.term_id
JOIN enrollment AS e ON sec.section_id = e.section_id
JOIN student    AS s ON e.student_id = s.student_id
WHERE s.fname = 'Bryce' AND s.lname = 'Carlson'
  AND t.name = 'Winter' AND t.year = 2018
ORDER BY c.name;

-- Query 7: The number of enrollments for Fall 2019.
SELECT t.name AS 'term', t.year, COUNT(*) AS 'Enrollment'
FROM term AS t
JOIN section    AS sec ON t.term_id = sec.term_id
JOIN enrollment AS e ON sec.section_id = e.section_id
WHERE t.name = 'Fall' AND t.year = 2019
GROUP BY t.name, t.year;

-- Query 8: The number of courses in each college.
SELECT col.name AS 'Colleges', COUNT(c.course_id) AS 'Courses'
FROM college AS col
JOIN department AS d ON col.college_id = d.college_id
JOIN course     AS c ON d.department_id = c.department_id
GROUP BY col.name
ORDER BY col.name;

-- Query 9: Total number of students each professor can teach in Winter 2018.
SELECT f.fname, f.lname, SUM(sec.capacity) AS 'TeachingCapacity'
FROM faculty AS f
JOIN section AS sec ON f.faculty_id = sec.faculty_id
JOIN term    AS t ON sec.term_id = t.term_id
WHERE t.name = 'Winter' AND t.year = 2018
GROUP BY f.faculty_id, f.fname, f.lname
ORDER BY SUM(sec.capacity), f.faculty_id;

-- Query 10: Each student's total credit load for Fall 2019 (more than three).
SELECT s.lname, s.fname, SUM(c.credits) AS 'Credits'
FROM student AS s
JOIN enrollment AS e ON s.student_id = e.student_id
JOIN section    AS sec ON e.section_id = sec.section_id
JOIN course     AS c ON sec.course_id = c.course_id
JOIN term       AS t ON sec.term_id = t.term_id
WHERE t.name = 'Fall' AND t.year = 2019
GROUP BY s.student_id, s.lname, s.fname
HAVING SUM(c.credits) > 3
ORDER BY SUM(c.credits) DESC, s.student_id;
