// backend/src/index.js
import 'dotenv/config';
import app from "./app.js";
import { PORT } from "./config.js";
import { connectDB } from "./db.js";

// Conectar a la base de datos
connectDB();

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📋 Rutas disponibles:`);
    console.log(`   - Auth: /api/login, /api/register`);
    console.log(`   - Tasks: /api/tasks`);
    console.log(`   - Owners: /api/owners ✅`);
    console.log(`   - Pets: /api/pets ✅`);
    console.log(`   - Appointments: /api/appointments ✅`);
    console.log(`   - Veterinarians: /api/veterinarians/available ✅`);
});