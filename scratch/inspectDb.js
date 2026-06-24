const mongoose = require('mongoose');

const uri = 'mongodb+srv://pethorizon2026:%40PetCare2026@pethorizoncluster.fv6v6rk.mongodb.net/pethorizon?retryWrites=true&w=majority&appName=PetHorizonCluster';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to database.');

  // Find user Aqib
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`ID: ${u._id}, Email: ${u.email}, Name: ${u.fullName}, ActivePetId: ${u.activePetId}`);
  });

  const pets = await mongoose.connection.db.collection('pets').find({}).toArray();
  console.log('--- PETS ---');
  pets.forEach(p => {
    console.log(`ID: ${p._id}, Name: ${p.name}, Species: ${p.species}, Owner: ${p.ownerUserId}, Family: ${p.familyId}`);
  });

  const schedules = await mongoose.connection.db.collection('scheduleitems').find({}).toArray();
  console.log(`--- SCHEDULES (${schedules.length}) ---`);
  schedules.forEach(s => {
    console.log(`ID: ${s._id}, PetId: ${s.petId}, Category: ${s.category}, Title: ${s.title}`);
  });

  const logs = await mongoose.connection.db.collection('schedulelogs').find({}).toArray();
  console.log(`--- LOGS (${logs.length}) ---`);

  await mongoose.disconnect();
}

run().catch(console.error);
