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
  `name` VARCHAR(75) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
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
  `title` VARCHAR(75) NOT NULL,
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
  `gender` CHAR(1) NOT NULL,
  `city` VARCHAR(45) NOT NULL,
  `state` CHAR(2) NOT NULL,
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
-- Table `section` (central table: one given instance of a course)
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
-- Table `enrollment` (linking table, composite primary key)
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

-- Catalog View: colleges
INSERT INTO `college` (`college_id`, `name`) VALUES
  (1, 'College of Physical Science and Engineering'),
  (2, 'College of Business and Communication'),
  (3, 'College of Language and Letters');

-- Catalog View: departments
INSERT INTO `department` (`department_id`, `name`, `code`, `college_id`) VALUES
  (1, 'Computer Information Technology',  'ITM',  1),
  (2, 'Economics',                        'ECON', 2),
  (3, 'Humanities and Philosophy',        'HUM',  3);

-- Catalog View: courses
INSERT INTO `course` (`course_id`, `course_num`, `title`, `credits`, `department_id`) VALUES
  (1, 111, 'Intro to Databases', 3, 1),
  (2, 388, 'Econometrics',       4, 2),
  (3, 150, 'Micro Economics',    3, 2),
  (4, 376, 'Classical Heritage', 2, 3);

-- Section View: faculty
INSERT INTO `faculty` (`faculty_id`, `fname`, `lname`, `department_id`) VALUES
  (1, 'Marty', 'Morring', 1),
  (2, 'Nate',  'Norris',  2),
  (3, 'Ben',   'Barrus',  2),
  (4, 'John',  'Jensen',  3),
  (5, 'Bill',  'Barney',  1);

-- Section View: terms
INSERT INTO `term` (`term_id`, `name`, `year`) VALUES
  (1, 'Fall',   2019),
  (2, 'Winter', 2018);

-- Student View: students
INSERT INTO `student` (`student_id`, `fname`, `lname`, `gender`, `city`, `state`, `birthdate`) VALUES
  (1,  'Paul',    'Miller',   'M', 'Dallas',  'TX', '1996-02-22'),
  (2,  'Katie',   'Smith',    'F', 'Provo',   'UT', '1995-07-22'),
  (3,  'Kelly',   'Jones',    'F', 'Provo',   'UT', '1998-06-22'),
  (4,  'Devon',   'Merrill',  'M', 'Mesa',    'AZ', '2000-07-22'),
  (5,  'Mandy',   'Murdock',  'F', 'Topeka',  'KS', '1996-11-22'),
  (6,  'Alece',   'Adams',    'F', 'Rigby',   'ID', '1997-05-22'),
  (7,  'Bryce',   'Carlson',  'M', 'Bozeman', 'MT', '1997-11-22'),
  (8,  'Preston', 'Larsen',   'M', 'Decatur', 'TN', '1996-09-22'),
  (9,  'Julia',   'Madsen',   'F', 'Rexburg', 'ID', '1998-09-22'),
  (10, 'Susan',   'Sorensen', 'F', 'Mesa',    'AZ', '1998-08-09');

-- Section View: sections
INSERT INTO `section` (`section_id`, `section_num`, `capacity`, `course_id`, `term_id`, `faculty_id`) VALUES
  (1,  1, 30, 1, 1, 1),   -- Fall 2019   ITM 111  sec 1 - Marty Morring
  (2,  1, 50, 3, 1, 2),   -- Fall 2019   ECON 150 sec 1 - Nate Norris
  (3,  2, 50, 3, 1, 2),   -- Fall 2019   ECON 150 sec 2 - Nate Norris
  (4,  1, 35, 2, 1, 3),   -- Fall 2019   ECON 388 sec 1 - Ben Barrus
  (5,  1, 30, 4, 1, 4),   -- Fall 2019   HUM 376  sec 1 - John Jensen
  (6,  2, 30, 1, 2, 1),   -- Winter 2018 ITM 111  sec 2 - Marty Morring
  (7,  3, 35, 1, 2, 5),   -- Winter 2018 ITM 111  sec 3 - Bill Barney
  (8,  1, 50, 3, 2, 2),   -- Winter 2018 ECON 150 sec 1 - Nate Norris
  (9,  2, 50, 3, 2, 2),   -- Winter 2018 ECON 150 sec 2 - Nate Norris
  (10, 1, 30, 4, 2, 4);   -- Winter 2018 HUM 376  sec 1 - John Jensen

-- Enrollment View: enrollments
INSERT INTO `enrollment` (`student_id`, `section_id`) VALUES
  (6,  7),   -- Alece   -> ITM 111  Winter 2018 Section 3
  (7,  6),   -- Bryce   -> ITM 111  Winter 2018 Section 2
  (7,  8),   -- Bryce   -> ECON 150 Winter 2018 Section 1
  (7,  10),  -- Bryce   -> HUM 376  Winter 2018 Section 1
  (4,  5),   -- Devon   -> HUM 376  Fall 2019   Section 1
  (9,  9),   -- Julia   -> ECON 150 Winter 2018 Section 2
  (2,  4),   -- Katie   -> ECON 388 Fall 2019   Section 1
  (3,  4),   -- Kelly   -> ECON 388 Fall 2019   Section 1
  (5,  4),   -- Mandy   -> ECON 388 Fall 2019   Section 1
  (5,  5),   -- Mandy   -> HUM 376  Fall 2019   Section 1
  (1,  1),   -- Paul    -> ITM 111  Fall 2019   Section 1
  (1,  3),   -- Paul    -> ECON 150 Fall 2019   Section 2
  (8,  9),   -- Preston -> ECON 150 Winter 2018 Section 2
  (10, 6);   -- Susan   -> ITM 111  Winter 2018 Section 2


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
JOIN enrollment AS e   ON s.student_id = e.student_id
JOIN section    AS sec ON e.section_id = sec.section_id
JOIN faculty    AS f   ON sec.faculty_id = f.faculty_id
WHERE f.fname = 'John' AND f.lname = 'Jensen'
ORDER BY s.lname;

-- Query 4: Instructors Bryce will have in Winter 2018.
SELECT DISTINCT f.fname, f.lname
FROM faculty AS f
JOIN section    AS sec ON f.faculty_id = sec.faculty_id
JOIN term       AS t   ON sec.term_id = t.term_id
JOIN enrollment AS e   ON sec.section_id = e.section_id
JOIN student    AS s   ON e.student_id = s.student_id
WHERE s.fname = 'Bryce' AND s.lname = 'Carlson'
  AND t.name = 'Winter' AND t.year = 2018
ORDER BY f.lname;

-- Query 5: Students that take Econometrics in Fall 2019.
SELECT s.fname, s.lname
FROM student AS s
JOIN enrollment AS e   ON s.student_id = e.student_id
JOIN section    AS sec ON e.section_id = sec.section_id
JOIN course     AS c   ON sec.course_id = c.course_id
JOIN term       AS t   ON sec.term_id = t.term_id
WHERE c.title = 'Econometrics'
  AND t.name = 'Fall' AND t.year = 2019
ORDER BY s.lname;

-- Query 6: All of Bryce Carlson's courses for Winter 2018.
SELECT d.code AS 'department_code', c.course_num, c.title AS 'name'
FROM course AS c
JOIN department AS d   ON c.department_id = d.department_id
JOIN section    AS sec ON c.course_id = sec.course_id
JOIN term       AS t   ON sec.term_id = t.term_id
JOIN enrollment AS e   ON sec.section_id = e.section_id
JOIN student    AS s   ON e.student_id = s.student_id
WHERE s.fname = 'Bryce' AND s.lname = 'Carlson'
  AND t.name = 'Winter' AND t.year = 2018
ORDER BY c.title;

-- Query 7: The number of enrollments for Fall 2019.
SELECT t.name AS 'term', t.year, COUNT(*) AS 'Enrollment'
FROM term AS t
JOIN section    AS sec ON t.term_id = sec.term_id
JOIN enrollment AS e   ON sec.section_id = e.section_id
WHERE t.name = 'Fall' AND t.year = 2019
GROUP BY t.name, t.year;

-- Query 8: The number of courses in each college.
SELECT col.name AS 'Colleges', COUNT(c.course_id) AS 'Courses'
FROM college AS col
JOIN department AS d ON col.college_id = d.college_id
JOIN course     AS c ON d.department_id = c.department_id
GROUP BY col.college_id, col.name
ORDER BY col.name;

-- Query 9: Total number of students each professor can teach in Winter 2018.
SELECT f.fname, f.lname, SUM(sec.capacity) AS 'TeachingCapacity'
FROM faculty AS f
JOIN section AS sec ON f.faculty_id = sec.faculty_id
JOIN term    AS t   ON sec.term_id = t.term_id
WHERE t.name = 'Winter' AND t.year = 2018
GROUP BY f.faculty_id, f.fname, f.lname
ORDER BY SUM(sec.capacity), f.faculty_id;

-- Query 10: Each student's total credit load for Fall 2019 (more than three).
SELECT s.lname, s.fname, SUM(c.credits) AS 'Credits'
FROM student AS s
JOIN enrollment AS e   ON s.student_id = e.student_id
JOIN section    AS sec ON e.section_id = sec.section_id
JOIN course     AS c   ON sec.course_id = c.course_id
JOIN term       AS t   ON sec.term_id = t.term_id
WHERE t.name = 'Fall' AND t.year = 2019
GROUP BY s.student_id, s.lname, s.fname
HAVING SUM(c.credits) > 3
ORDER BY SUM(c.credits) DESC, s.student_id;
