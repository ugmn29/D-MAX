/*
  Warnings:

  - You are about to drop the `advertising_costs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `appointment_staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lab_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `labs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patient_acquisition_channels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `receipts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `self_pay_treatments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shifts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_evaluation_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_evaluation_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "advertising_costs" DROP CONSTRAINT "advertising_costs_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "appointment_staff" DROP CONSTRAINT "appointment_staff_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "appointment_staff" DROP CONSTRAINT "appointment_staff_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_created_by_fkey";

-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_lab_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_medical_record_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "labs" DROP CONSTRAINT "labs_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "patient_acquisition_channels" DROP CONSTRAINT "patient_acquisition_channels_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "patient_acquisition_channels" DROP CONSTRAINT "patient_acquisition_channels_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "patient_acquisition_channels" DROP CONSTRAINT "patient_acquisition_channels_referral_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "self_pay_treatments" DROP CONSTRAINT "self_pay_treatments_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_substitute_for_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_evaluation_results" DROP CONSTRAINT "staff_evaluation_results_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_evaluation_results" DROP CONSTRAINT "staff_evaluation_results_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_evaluation_settings" DROP CONSTRAINT "staff_evaluation_settings_clinic_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_evaluation_settings" DROP CONSTRAINT "staff_evaluation_settings_position_id_fkey";

-- DropTable
DROP TABLE "advertising_costs";

-- DropTable
DROP TABLE "appointment_staff";

-- DropTable
DROP TABLE "lab_orders";

-- DropTable
DROP TABLE "labs";

-- DropTable
DROP TABLE "patient_acquisition_channels";

-- DropTable
DROP TABLE "profiles";

-- DropTable
DROP TABLE "receipts";

-- DropTable
DROP TABLE "self_pay_treatments";

-- DropTable
DROP TABLE "shifts";

-- DropTable
DROP TABLE "staff_evaluation_results";

-- DropTable
DROP TABLE "staff_evaluation_settings";
