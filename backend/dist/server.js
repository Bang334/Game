"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const admin_1 = __importDefault(require("./routes/admin"));
const customer_1 = __importDefault(require("./routes/customer"));
const auth_1 = __importDefault(require("./routes/auth"));
const reco_1 = __importDefault(require("./routes/reco"));
const interactionRoutes_1 = __importDefault(require("./routes/interactionRoutes"));
const db_1 = require("./db");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', async (_req, res) => {
    try {
        await (0, db_1.pingDatabase)();
        res.json({ ok: true, db: 'up' });
    }
    catch {
        res.status(500).json({ ok: false, db: 'down' });
    }
});
// Serve static demo UI (e.g., http://localhost:3001/reco.html)
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
app.use('/api/admin', admin_1.default);
app.use('/api/customer', customer_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/reco', reco_1.default);
app.use('/api/interactions', interactionRoutes_1.default);
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map