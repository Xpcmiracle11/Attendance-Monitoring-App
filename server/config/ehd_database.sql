-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 04, 2025 at 03:36 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ehd_database`
--

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(32, 'IT Department', 'An IT department, short for Information Technology department, is the division within an organization responsible for managing and maintaining its technology infrastructure, including hardware, software, networks, and systems, ensuring they function smoothly and securely. ', '2025-03-25 02:37:44', '2025-03-25 02:37:44'),
(33, 'Opertations', 'The operations department is a critical function within an organization that manages and oversees the day-to-day activities and processes of the business, ensuring efficient and effective operations to meet organizational goals. ', '2025-03-27 06:16:31', '2025-03-27 06:16:31'),
(34, 'Human Resources', 'The HR department is responsible for managing employment-related tasks and issues and engaging the team.', '2025-03-31 02:06:29', '2025-03-31 02:06:29');

-- --------------------------------------------------------

--
-- Table structure for table `schedule_details`
--

CREATE TABLE `schedule_details` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `schedule_status` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedule_details`
--

INSERT INTO `schedule_details` (`id`, `user_id`, `day`, `start_time`, `end_time`, `schedule_status`) VALUES
(6, 13, 'Monday', '00:00:00', '00:00:00', 'TBD'),
(7, 13, 'Tuesday', '00:00:00', '00:00:00', 'TBD'),
(8, 13, 'Wednesday', '00:00:00', '00:00:00', 'TBD'),
(9, 13, 'Thursday', '00:00:00', '00:00:00', 'TBD'),
(10, 13, 'Friday', '00:00:00', '00:00:00', 'TBD'),
(11, 13, 'Saturday', '00:00:00', '00:00:00', 'TBD'),
(12, 13, 'Sunday', '00:00:00', '00:00:00', 'TBD'),
(13, 14, 'Monday', '00:00:00', '00:00:00', 'TBD'),
(14, 14, 'Tuesday', '00:00:00', '00:00:00', 'TBD'),
(15, 14, 'Wednesday', '00:00:00', '00:00:00', 'TBD'),
(16, 14, 'Thursday', '00:00:00', '00:00:00', 'TBD'),
(17, 14, 'Friday', '00:00:00', '00:00:00', 'TBD'),
(18, 14, 'Saturday', '00:00:00', '00:00:00', 'TBD'),
(19, 14, 'Sunday', '00:00:00', '00:00:00', 'TBD'),
(20, 15, 'Monday', '08:00:00', '17:00:00', 'Fixed'),
(21, 15, 'Tuesday', '08:00:00', '17:00:00', 'Fixed'),
(22, 15, 'Wednesday', '08:00:00', '17:00:00', 'Fixed'),
(23, 15, 'Thursday', '00:00:00', '00:00:00', 'Flexible'),
(24, 15, 'Friday', '00:00:00', '00:00:00', 'Flexible'),
(25, 15, 'Saturday', '00:00:00', '00:00:00', 'Day Off'),
(26, 15, 'Sunday', '00:00:00', '00:00:00', 'Day Off'),
(27, 16, 'Monday', '08:00:00', '17:00:00', 'Fixed'),
(28, 16, 'Tuesday', '08:00:00', '17:00:00', 'Fixed'),
(29, 16, 'Wednesday', '08:00:00', '17:00:00', 'Fixed'),
(30, 16, 'Thursday', '08:00:00', '17:00:00', 'Fixed'),
(31, 16, 'Friday', '08:00:00', '17:00:00', 'Fixed'),
(32, 16, 'Saturday', '00:00:00', '00:00:00', 'Day Off'),
(33, 16, 'Sunday', '00:00:00', '00:00:00', 'Day Off');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `gender` varchar(50) NOT NULL,
  `birth_date` date NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `region` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `municipality` varchar(100) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `street` varchar(100) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `branch` varchar(50) NOT NULL,
  `salary` decimal(10,0) NOT NULL,
  `password` varchar(255) NOT NULL,
  `image_file_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `gender`, `birth_date`, `email`, `phone_number`, `region`, `province`, `municipality`, `barangay`, `street`, `department_id`, `role`, `branch`, `salary`, `password`, `image_file_name`, `created_at`, `updated_at`) VALUES
(13, 'Anastasia', 'Janairo', 'Arciaga', 'Female', '2001-05-08', 'tasha@gmail.com', '639850244406', 'REGION VI (WESTERN VISAYAS)', 'ANTIQUE', 'CULASI', 'Centro Poblacion', '', 34, 'Staff', 'Iloilo', 18000, '$2b$10$YVXC3sUu5giRaggjkHHWX.5ei4KygAwK6icoJtAFVj/zMlUupBxfG', 'Anastasia_13.jpg', '2025-04-01 00:52:59', '2025-04-01 00:52:59'),
(14, 'Charles', 'Callado', 'Monreal', 'Male', '2001-08-11', 'charlesagustin.monreal@gmail.com', '639850254406', 'REGION VI (WESTERN VISAYAS)', 'ILOILO', 'MIAGAO', 'Baybay Sur (Pob.)', 'Hinolan Street', 32, 'Admin', 'Iloilo', 18000, '$2b$10$z6EtvceUnyTlEn5DiWQ3X.CUH7qRcTdO3iMMoKiFxNEh7Lv.ZvFFG', 'Charles_14.png', '2025-04-01 01:05:39', '2025-04-03 02:01:12'),
(15, 'Marr', 'Christian', 'Cuarre', 'Male', '2001-10-10', 'marr@gmail.com', '63985224403', 'REGION VI (WESTERN VISAYAS)', 'ILOILO', 'OTON', 'Poblacion West', '', 32, 'Admin', 'Iloilo', 18000, '$2b$10$K3kJ3iqKkXjVv7y1odp.Ku/M4ijI37Sjbj1.fksEQRkfhPctj/uSa', 'Marr_15.png', '2025-04-01 03:44:44', '2025-04-01 03:44:44'),
(16, 'Royce', 'Alagos', 'Trinidad', 'Male', '2001-12-20', 'royce@gmail.com', '63972449322', 'REGION VI (WESTERN VISAYAS)', 'ILOILO', 'ILOILO CITY (Capital)', 'Buhang Taft North', '', 32, 'Staff', 'Iloilo', 18000, '$2b$10$5fgw0y1J7YAbP42o5ACmoeM5NbpCFD7Hma24.4JwJPmoR9R6SW0KW', 'Royce_16.jfif', '2025-04-01 07:21:13', '2025-04-01 07:21:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `schedule_details`
--
ALTER TABLE `schedule_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_department` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `schedule_details`
--
ALTER TABLE `schedule_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `schedule_details`
--
ALTER TABLE `schedule_details`
  ADD CONSTRAINT `schedule_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
