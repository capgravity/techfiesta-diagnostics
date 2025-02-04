const prisma = require("./utils/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create 5 doctors
  const doctorsData = [
    { name: "Dr. Alice Brown", email: "alice@example.com", specialty: "Neurology" },
    { name: "Dr. Bob Green", email: "bob@example.com", specialty: "Cardiology" },
    { name: "Dr. Carol White", email: "carol@example.com", specialty: "Pediatrics" },
    { name: "Dr. David Black", email: "david@example.com", specialty: "Oncology" },
    { name: "Dr. Eve Gray", email: "eve@example.com", specialty: "Dermatology" }
  ];

  const createdDoctors = [];
  for (const docData of doctorsData) {
    const doctor = await prisma.doctor.create({
      data: {
        name: docData.name,
        email: docData.email,
        password: hashedPassword,
        specialty: docData.specialty,
      },
    });
    createdDoctors.push(doctor);
  }

  // Create patients with associated data
  const patientsData = [
    {
      name: "John Smith",
      email: "john.smith@example.com",
      age: 67,
      gender: "Male",
      biomarkers: ["Aβ42", "Tau"],
      brainScan: {
        scanType: "MRI",
        scanDate: new Date("2023-01-15"),
        scanImage: "http://example.com/scans/john_mri.jpg",
        tumorDetected: true,
        tumorType: "Benign",
      },
      cognitiveTests: [
        {
          testName: "MMSE",
          testDate: new Date("2023-01-10"),
          score: 25,
          interpretation: "Mild Cognitive Impairment",
        },
        {
          testName: "MoCA",
          testDate: new Date("2023-01-12"),
          score: 22,
          interpretation: "Moderate Cognitive Impairment",
        },
      ],
    },
    {
      name: "Mary Johnson",
      email: "mary.johnson@example.com",
      age: 58,
      gender: "Female",
      biomarkers: ["pTau"],
      brainScan: {
        scanType: "CT",
        scanDate: new Date("2023-02-20"),
        scanImage: "http://example.com/scans/mary_ct.jpg",
        tumorDetected: false,
      },
      cognitiveTests: [
        {
          testName: "MMSE",
          testDate: new Date("2023-02-18"),
          score: 28,
          interpretation: "Normal",
        },
        {
          testName: "Clock Drawing Test",
          testDate: new Date("2023-02-19"),
          score: 4,
          interpretation: "Mild Impairment",
        },
      ],
    },
    {
      name: "Tom Davis",
      email: "tom.davis@example.com",
      age: 72,
      gender: "Male",
      biomarkers: ["Aβ40", "NfL"],
      brainScan: {
        scanType: "MRI",
        scanDate: new Date("2023-03-10"),
        scanImage: "http://example.com/scans/tom_mri.jpg",
        tumorDetected: true,
        tumorType: "Malignant",
      },
      cognitiveTests: [
        {
          testName: "MoCA",
          testDate: new Date("2023-03-05"),
          score: 18,
          interpretation: "Severe Cognitive Impairment",
        },
        {
          testName: "ADAS-Cog",
          testDate: new Date("2023-03-08"),
          score: 30,
          interpretation: "Moderate Alzheimer's",
        },
      ],
    },
    {
      name: "Lucy Wilson",
      email: "lucy.wilson@example.com",
      age: 63,
      gender: "Female",
      biomarkers: ["GFAP"],
      brainScan: {
        scanType: "MRI",
        scanDate: new Date("2023-04-05"),
        scanImage: "http://example.com/scans/lucy_mri.jpg",
        tumorDetected: false,
      },
      cognitiveTests: [
        {
          testName: "MMSE",
          testDate: new Date("2023-04-01"),
          score: 26,
          interpretation: "Mild Cognitive Impairment",
        },
        {
          testName: "RAVLT",
          testDate: new Date("2023-04-03"),
          score: 45,
          interpretation: "Normal Memory Function",
        },
      ],
    },
    {
      name: "Emma Clark",
      email: "emma.clark@example.com",
      age: 70,
      gender: "Female",
      biomarkers: ["Aβ42", "pTau"],
      brainScan: {
        scanType: "CT",
        scanDate: new Date("2023-05-12"),
        scanImage: "http://example.com/scans/emma_ct.jpg",
        tumorDetected: true,
        tumorType: "Benign",
      },
      cognitiveTests: [
        {
          testName: "MoCA",
          testDate: new Date("2023-05-10"),
          score: 24,
          interpretation: "Mild Cognitive Impairment",
        },
        {
          testName: "Trail Making Test B",
          testDate: new Date("2023-05-11"),
          score: 120,
          interpretation: "Mild Executive Dysfunction",
        },
      ],
    },
  ];

  for (let i = 0; i < createdDoctors.length; i++) {
    const doctor = createdDoctors[i];
    const pData = patientsData[i];
    
    await prisma.patient.create({
      data: {
        name: pData.name,
        email: pData.email,
        age: pData.age,
        gender: pData.gender,
        alzheimerBiomarkers: { set: pData.biomarkers },
        doctor: { connect: { id: doctor.id } },
        brainScan: {
          create: pData.brainScan,
        },
        cognitiveTests: {
          create: pData.cognitiveTests,
        },
      },
    });
  }

  console.log("Successfully seeded:");
  console.log("- 5 Doctors");
  console.log("- 5 Patients");
  console.log("- 5 Brain Scans");
  console.log("- 10 Cognitive Tests");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });